// globals
subjects = [];
standards = [];
const urlParams = new URLSearchParams(window.location.search); // get url parameters
const subject_id = parseInt(urlParams.get('id'));
subject = 0;

// for accessing the search engine
const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: '',
})

// const for svg icons
const starOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
  <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.523-3.356c.329-.314.158-.888-.283-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767l-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288l1.847-3.658 1.846 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.564.564 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
</svg>`;
const starFull = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
</svg>`;    
const cross = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
</svg>`;

function getSubjects() { // update the local list of subjects
    $.get("/api/subjects", function(data) { // send a get request to my api
        if (data.success) {
            console.log("Successfully gathered " + data['subjects'].length.toString() + " subjects");
            subjects = data['subjects'];
            getStandards(); // run the next function
        } else {
            alert("Failure to get subjects. Try reloading. If the problem persists, email linus@molteno.net");
        }
    });
}

function getStandards(then=function(){a=1}) { // get the list of standards for the subject
    $.get("/api/standards?subject=" + subject_id.toString(), (data) => {
        if (data.success) {
            console.log("Successfully gathered " + data.standards.length.toString() + " standards");
            standards = data.standards;
            updateEverything(); // run the next function
        } else {
            alert("Failure to get standards. Try reloading. If the problem persists, email linus@molteno.net");
        }
    }); 
}

async function search() {
    searchtext = $("#searchbox").val()
    
    if (searchtext.length != 0) {
        // standards stuff
        const standindex = client.index('standards')
        
        const standards = await standindex.search(searchtext, {limit: 5})
        
        outhtml = ""
        if (standards['hits'].length > 0) {
            outhtml +=  `<h3 class="mb-0 border-bottom">Standards</h3>
                        <table class="table-responsive table table-hover">
                            <thead>
                                <tr>
                                <th scope="col" class="col-1">Number</th>
                                <th scope="col" class="col-9">Title</th>
                                <th scope="col">Type</th>
                                <th scope="col">Level</th>
                                <th scope="col">Credits</th>
                                <th scope="col">I/E</th>
                                </tr>
                            </thead>
                            <tbody>`;
            standards['hits'].forEach(result => {
                outhtml += "<tr class='clickable' onclick='linkToAssessment(" + result.id + ")'>"
                outhtml += "<th scope='row'><span class='float-end'>" + result.id + "</span></th>"
                outhtml += "<td>" + result.title + "</td>"
                outhtml += "<td>" + ((parseInt(result.id) < 90000) ? "Unit" : "Achievement") + "</td>"
                outhtml += "<td>" + result.level.toString() + "</td>"
                outhtml += "<td>" + result.credits.toString() + "</td>"
                outhtml += "<td>" + (result.internal ? "Internal" : "External") + "</td>"
                outhtml += "</tr>"
            });
            outhtml += "</tbody></table>"
        }
        
        // subjects stuff
        const subjindex = client.index('subjects')
        
        const subjects = await subjindex.search(searchtext, {limit: 5})
        if (subjects.hits.length > 0) {
            outhtml += `<h3 class="mb-0 border-bottom">Subjects</h3>
                        <table class="table-responsive table">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                </tr>
                            </thead>
                            <tbody>`;
            subjects['hits'].forEach(result => {
                outhtml += "<tr>"
                outhtml += "<td>"
                outhtml += "<a href='/subject/?id=" + result.id + "' class='text-decoration-none link'>" + result.name + "</a></td>"
                outhtml += "</tr>"
            });
            outhtml += "</tbody></table>"
        }
        
        if (subjects.hits.length == 0 && standards.hits.length == 0) {
            outhtml = "<p class='text-muted mb-2'>Nothin' here!</p>"
        }
        $("#search-results").html(outhtml)
        $("#search-results").css("visibility","visible");
    } else {
        $("#search-results").html("")
        $("#search-results").css("visibility","hidden");
    }
}

function linkToAssessment(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}

function updateEverything() { // populate the standards list, and the subject name
    subject = subjects.find(o => o.subject_id == subject_id)
    $("#subject-name").hide()
    $("#subject-name").html(subject.name);
    $("#subject-name").fadeIn() // I love this so much
    outhtml = `<h3 class="mb-0 border-bottom">Standards</h3>
                <table class="table-responsive table table-hover">
                    <thead>
                        <tr>
                        <th scope="col" class="col-1">Number</th>
                        <th scope="col" class="col-9">Title</th>
                        <th scope="col">Type</th>
                        <th scope="col">Level</th>
                        <th scope="col">Credits</th>
                        <th scope="col">I/E</th>
                        </tr>
                    </thead>
                    <tbody>`;
    [1,2,3].forEach(level => { // for each level
        outhtml += "<tr><th colspan=6 class='text-center border-bottom border-dark'>Level " + level +"</th></tr>"
        standards.forEach(standard => { // for each standard
            if (standard.level == level) {
                outhtml += "<tr class='clickable' onclick='linkToAssessment(" + standard.standard_number + ")'>"
                outhtml += "<th scope='row'><span class='float-end'>" + standard.standard_number + "</span></th>"
                outhtml += "<td>" + standard.title + "</td>"
                outhtml += "<td>" + ((parseInt(standard.standard_number) < 90000) ? "Unit" : "Achievement") + "</td>"
                outhtml += "<td>" + standard.level + "</td>"
                outhtml += "<td>" + standard.credits + "</td>"
                outhtml += "<td>" + (standard.internal ? "Internal" : "External") + "</td>"
                outhtml += "</tr>"
            }
        });
    });
    outhtml += "</tbody></table>"
    $("#main-container").html(outhtml);
}

$(document).ready(function() {
    getSubjects(); // for async requests, we have to do "thens", like promises
    $("#searchbox").val("")
    search();
    document.getElementById("searchbox").addEventListener('input', search);
});
