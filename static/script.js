// globals
subjects = [];
starred = [];

// for accessing the search engine
const client = new MeiliSearch({
    host: "https://" + window.location.host.toString(),
    apiKey: '',
})

// subjects stuff
const subjindex = client.index('subjects')
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

function getSubjects(then=function(){a=1}) { // update the local list of subjects
    $.get("/api/subjects", function(data) { // send a get request to my api
        if (data.success) {
            console.log("Successfully gathered " + data['subjects'].length.toString() + " subjects");
            subjects = data['subjects'];
            then(); // run the next function, which defaults to nothing
        } else {
            alert("Failure to get subjects. Try reloading. If the problem persists, email linus@molteno.net");
        }
    });
}

function displaySubjects() { // display the current list of subjects
    console.log("Displaying " + subjects.length.toString() + " subjects"); 
    outhtml = "" // this will be filled with list elements
    subjects.forEach(subject => {
        outhtml += generateSubjectLI(subject);
    });
    $("#subjectlist").html(outhtml);
}

function generateSubjectLI(subject) {
    // construct li element for each subject with a star
    outhtml = ""
    outhtml += "<li class='py-1 row'><a type='button' onClick='starSubject("
    outhtml += subject.subject_id.toString();
    outhtml += ", this)' class='col-1 btn float-start btn-sm p-0 pe-2'>";
    // check if the subject is starred or not
    is_starred = starred.find(s => s.subject_id === subject.subject_id)
    if (is_starred) {
        outhtml += starFull + "</a>";
    } else {
        outhtml += starOutline + "</a>";
    }
    outhtml += "<a class='col link text-decoration-none px-0 mx-2' href=/subject/?id=";
    outhtml += subject.subject_id.toString();
    outhtml += ">";
    outhtml += subject.name;
    outhtml += "</a></li>"
    return outhtml
}

function starSubject(subject_id, element) {
    if (starred.find(s => s.subject_id === subject_id)) { // already starred
        index = starred.findIndex(s => s.subject_id === subject_id); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        element.innerHTML = starFull; // fill star
        subject = subjects.find(s => s.subject_id === subject_id); // get object (from id)
        starred.push(subject); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displayStarred(); // update display
}

function unstarSubject(subject_id, element) { // for removing the starred subject, with the event from the starred list
    index = starred.findIndex(s => s.subject_id === subject_id); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displayStarred(); // update display
    displaySubjects();
}

function getStarred(then=None) {
    if (window.localStorage.getItem('starred')) { // if this has been done before
        starred = JSON.parse(window.localStorage.getItem('starred')); // update from browser storage (which only stores strings)
    } else {
        window.localStorage.setItem('starred', JSON.stringify(starred)); // initialise with empty array
    }
    then();
}

function generateStarredCard(subject) {
    // construct card element for each starred subject
    outhtml = "<div class='col'><div class='card'>"
    outhtml += `<div class='card-header' style="transform: rotate(0);">
                    <div class='close-starred'><a type='button' onClick='unstarSubject(` + subject.subject_id + `, this)'
                       class='col-1 btn float-end btn-sm p-0'>` + cross + `</a></div>
                    <a class='link text-decoration-none stretched-link starred-link' href=/subject/?id=` + subject.subject_id + `>
                    ` + subject.name + `</a>
                </div>
                <ul class="list-group list-group-flush">
                    <a class='list-group-item list-group-item-action' href=/subject/?id=` + subject.subject_id + `&level=1>Level 1</a>
                    <a class='list-group-item list-group-item-action' href=/subject/?id=` + subject.subject_id + `&level=2>Level 2</a>
                    <a class='list-group-item list-group-item-action' href=/subject/?id=` + subject.subject_id + `&level=3>Level 3</a>
                </ul>
               </div></div>`;
    return outhtml
}

function displayStarred() {
    if (starred.length == 0) {
        $("#starredlist").html("<p class='text-muted'>Nothin' here!</p>");
        $("#starredHeader").html('My Subjects<small class="text-muted fs-6 ps-3 fw-light">Hit the ' + starOutline + ' icon to add a subject here</small>');
    } else {
        $("#starredHeader").html('My Subjects');
        $("#starredlist").hide();
        outhtml = ""
        starred.forEach(subject => {
            outhtml += generateStarredCard(subject);
        });
        $("#starredlist").html(outhtml);
        $("#starredlist").fadeIn();
    }
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

async function search() {
    searchtext = $("#searchbox").val()
    
    if (searchtext.length != 0) {
        const standards = await standindex.search(searchtext, {limit: 5})
        if (standards['hits'].length > 0) {
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
            standards['hits'].forEach(result => {
                standardshtml += generateStandardRow(result)
            });
            standardshtml += "</tbody></table>"
            $("#standards-results").html(standardshtml)
        } else {
            $("#standards-results").html("");
        }
        
        const subjects = await subjindex.search(searchtext, {limit: 5})
        if (subjects.hits.length > 0) {
            subjecthtml = `<h3 class="mb-1">Subjects</h3>
                        <table class="table table-bordered border-0">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                </tr>
                            </thead>
                            <tbody>`;
            subjects['hits'].forEach(result => {
                subjecthtml += "<tr>"
                subjecthtml += "<td>"
                subjecthtml += "<a type='button' onClick='starSubject("
                subjecthtml += result.id;
                subjecthtml += ", this)' class='col-1 btn float-start btn-sm p-0 pe-3'>";
                // check if the subject is starred or not
                is_starred = starred.find(s => s.subject_id === parseInt(result.id))
                if (is_starred) {
                    subjecthtml += starFull + "</a>";
                } else {
                    subjecthtml += starOutline + "</a>";
                }       
                subjecthtml += "<a href='/subject/?id=" + result.id + "' class='text-decoration-none link'>" + result.name + "</a></td>"
                subjecthtml += "</tr>"
            });
            subjecthtml += "</tbody></table>"
            $("#subjects-results").html(subjecthtml)
        } else {
            $("#subjects-results").html("");
        }
        
        if (subjects.hits.length == 0 && standards.hits.length == 0) {
            $("#subjects-results").html("<p class='text-muted mb-2'>Nothin' here!</p>")
        }
        $("#search-results").css("visibility","visible");
    } else {
//         $("#search-results").html("")
        $("#subjects-results").html("")
        $("#standards-results").html("")
        $("#search-results").css("visibility","hidden");
    }
}

function linkToAssessment(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}

$(document).ready(function() {
    getSubjects(then=displaySubjects); // for async requests, we have to do "thens", like promises
    getStarred(then=displayStarred); // reference the local storage to find the starred subjects
    // disable the enter key going to a new url in the search box
    $("#searchbox").val("") // reset value
    search(); // initialise search results
    document.getElementById("searchbox").addEventListener('input', search); // when something is input, search
});
