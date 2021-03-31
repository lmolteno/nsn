// globals
subjects = [];
standards = [];
const urlParams = new URLSearchParams(window.location.search); // get url parameters
if (urlParams.get('id') == null) {
    window.location = "/"; // if there's no id parameter in the url
}
// get level in url parameters, else null (inline ifs can be confusing sorry)
const level = (urlParams.get('level') == null) ? null : parseInt(urlParams.get('level')); 
const subject_id = parseInt(urlParams.get('id'));
subject = 0;

// for accessing the search engine
const client = new MeiliSearch({
    host: "https://" + window.location.host.toString(),
    apiKey: '',
})

// search stuff
const standindex = client.index('standards')

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
        const searched_standards = await standindex.search(searchtext, {limit: 100})
        if (searched_standards['hits'].length > 0) {
            var filtered = []
            // for all of the hits, check if they're in the list of standards for this subject
            searched_standards['hits'].forEach(result => {
                if (standards.find(o => o.standard_number == result.id) && filtered.length < 5) {
                    filtered.push(result)
                }
            })
            standardshtml =  `<h3 class="mb-1">Standards</h3>

                        <table class="table-bordered border-0 table table-hover">
                            <thead>
                                <tr>
                                <th scope="col" class="col-1 text-end">Number</th>
                                <th scope="col" class="col-9">Title</th>
                                <th scope="col">Type</th>
                                <th scope="col">Level</th>
                                <th scope="col">Credits</th>
                                <th scope="col">I/E</th>
                                </tr>
                            </thead>
                            <tbody>`;
            filtered.forEach(result => {
                standardshtml += generateStandardRow(result)
            });
            standardshtml += "</tbody></table>"
            if (filtered.length == 0) {
                standardshtml = "<p class='text-muted mb-2'>Nothin' here!</p>";
            }
            $("#standards-results").html(standardshtml)
        }
        
        $("#search-results").css("visibility","visible");
    } else {
        $("#standards-results").html("")
        $("#search-results").css("visibility","hidden");
    }
}

function linkToAssessment(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}

function generateSubjectRow(subject) {
    outhtml = ""
    outhtml += "<tr>"
    outhtml += "<td>"
    outhtml += "<a href='/subject/?id=" + subject.id + "' class='text-decoration-none link'>" + subject.name + "</a></td>"
    outhtml += "</tr>"
    return outhtml
}

function generateStandardRow(standard) {
    outhtml = ""
    i_e_class = standard.internal ? "internal_row" : "external_row";
    if (standard.standard_number != null) {
        outhtml += "<tr class='clickable " + i_e_class + "' onclick='linkToAssessment(" + standard.standard_number + ")'>"
        outhtml += "<th scope='row'><span class='float-end'>" + standard.standard_number + "</span></th>"
    } else {
        outhtml += "<tr class='clickable " + i_e_class + "' onclick='linkToAssessment(" + standard.id + ")'>"
        outhtml += "<th scope='row'><span class='float-end'>" + standard.id + "</span></th>"
    }
    outhtml += "<td>" + standard.title + "</td>"
    if (standard.standard_number != null) {
        outhtml += "<td>" + ((parseInt(standard.standard_number) < 90000) ? "Unit" : "Achievement") + "</td>"
    } else {
        outhtml += "<td>" + ((parseInt(standard.id) < 90000) ? "Unit" : "Achievement") + "</td>"
    }        
    outhtml += "<td class='text-center'>" + standard.level + "</td>"
    outhtml += "<td class='text-center'>" + standard.credits + "</td>"
    outhtml += "<td>" + (standard.internal ? "Internal" : "External") + "</td>"
    outhtml += "</tr>"
    return outhtml
}

function updateEverything() { // populate the standards list, and the subject name
    subject = subjects.find(o => o.subject_id == subject_id)
    $("#subject-name").hide()
    $("#subject-name").html(subject.name);
    $("#subject-name").fadeIn() // I love this so much
    $("#nav-breadcrumbs").hide()
    if (level != null) {
        $("#nav-breadcrumbs").html(`<a class="nav-link" href=/>Home</a>
                                    <span class='nav-link disabled'>/</span>
                                    <a class="nav-link" href=/subject/?id=` + subject_id + `>` + subject.name + `</a>
                                    <span class='nav-link disabled'>/</span>
                                    <a class="nav-link active" aria-current="page">Level ` + level + `</a>`);
    } else {
        $("#nav-breadcrumbs").html(`<a class="nav-link" href="/">Home</a>
                                    <span class='nav-link disabled'>/</span>
                                    <a class="nav-link active" aria-current="page">` + subject.name + `</a>`);    
    }
    $("#nav-breadcrumbs").fadeIn() // I love this so much
    outhtml = ` <div class="table-responsive">
                <h3 class="mb-1">Standards</h3>
                <table class="table table-bordered table-hover bg-white border-0">
                    <thead>
                        <tr>
                        <th scope="col" class="col-1 text-end">Number</th>
                        <th scope="col" class="col-9">Title</th>
                        <th scope="col">Type</th>
                        <th scope="col">Level</th>
                        <th scope="col">Credits</th>
                        <th scope="col">I/E</th>
                        </tr>
                    </thead>`;
    var level_arr = (level == null) ? [1,2,3] : [level,]
    level_arr.forEach(current_level => { // for each level allowed on the page
        standards_for_level = standards.filter(o => o.level == current_level);
        if (standards_for_level.length > 0) {
            outhtml += "<thead><tr><th colspan=6 class='text-center border border-dark'>Level " + current_level +"</th></tr></thead><tbody>"
            standards_for_level.forEach(standard => { // for each standard
                outhtml += generateStandardRow(standard)
            });
            outhtml += "</tbody>";
        } else {
            outhtml += "<thead><tr><th colspan=6 class='text-center border border-dark'>No standards for Level " + current_level +"</th></tr></thead>";
        }
    });
    outhtml += "</tbody></table></div>";
    $("#main-container").hide();
    $("#main-container").html(outhtml);
    $("#main-container").fadeIn();    
}

$(document).ready(function() {
    getSubjects(); // for async requests, we have to do "thens", like promises
    $("#searchbox").val("")
    search();
    document.getElementById("searchbox").addEventListener('input', search);
});
