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
    console.log("Searching!");
    searchtext = $("#searchbox").val()
    
    if (searchtext.length != 0) {
        searched_standards = await standindex.search(searchtext, {limit: 100})
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
                                <th scope="col" class="col text-end">Number</th>
                                <th scope="col" class="col">Title</th>
                                <th scope="col">Type</th>
                                <th scope="col">Credits</th>
                                <th scope="col">Literacy</th>
                                <th scope="col">Numeracy</th>
                                <th scope="col">I/E</th>
                                </tr>
                            </thead>
                            <tbody>`;
            filtered.forEach(result => {
                standardshtml += generateSearchStandardRow(result)
            });
            standardshtml += "</tbody></table>"
            if (filtered.length == 0) {
                standardshtml = "<p class='text-muted mb-2'>Nothin' here!</p>";
            }
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility","visible");
        } else {
            standardshtml = "<p class='text-muted mb-2'>Nothin' here!</p>";
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility","visible");
        }
        
                
        if ($("#searchbox").val().length == 0) { // recheck the box after all the awaits, just in case things have changed (#3)
            $("#subjects-results").html("")
            $("#standards-results").html("")
            $("#search-results").css("visibility","hidden");
        } else {
            $("#search-results").css("visibility","visible");
        }
    } else {
        $("#standards-results").html("")
        $("#search-results").css("visibility","hidden");
    }
}

function generateSubjectRow(subject) {
    outhtml = ""
    outhtml += "<tr>"
    outhtml += "<td>"
    outhtml += "<a href='/subject/?id=" + subject.id + "' class='text-decoration-none link'>" + subject.name + "</a></td>"
    outhtml += "</tr>"
    return outhtml
}

function generateSearchStandardRow(standard) {
    outhtml = ""
    i_e_class = standard.internal ? "internal_row" : "external_row"; // class for internal vs external colouring

    outhtml += "<tr class='clickable " + i_e_class + "'>" // initialise row
    // add <th> (header) styled standard number with link to the standard page
    outhtml += `    <th scope='row' style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        <span class='float-end'>` + standard.id + `</span>
                    </th>`
    
    // add all the other information in <td> styled boxes
    outhtml += `    <td style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        ` + standard.title + `
                    </td>
                    <td style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        ` + ((parseInt(standard.id) < 90000) ? "Unit" : "Achievement") + `
                    </td>
                    <td class='text-center' style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        ` + standard.credits + `
                    </td>
                    <td style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        <span class='float-start'>` + (standard.reading ? "R" : "N") + `</span>
                        <span class='float-end'>` + (standard.writing ? "W" : "N") + `</span>
                    </td>
                    <td class='text-center' style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        ` + (standard.numeracy ? "Y" : "N") + `
                    </td>
                    <td style='position: relative;'>
                        <a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>
                        ` + (standard.internal ? `Internal` : `External`) + `
                    </td>
                </tr>`;
    return outhtml
}

function generateStandardRow(standard) {
    standard['id'] = standard['standard_number']
    return generateSearchStandardRow(standard); // the only difference between a search-standard and a not one is the id
    // replaced with the standard number 
}


function updateEverything() { // populate the standards list, and the subject name
    subject = subjects.find(o => o.subject_id == subject_id)
    $("#subject-name").hide()
    $("#subject-name").html(subject.display_name);
    
    $("#searchbox").attr("placeholder", "Search " + subject.display_name + " standards");
    
    $("#subject-name").fadeIn() // I love this so much
    $("#nav-breadcrumbs").hide()
    if (level != null) {
        $("#nav-breadcrumbs").html(`<div class='row'><div class='col-auto pe-lg-0'><a class="nav-link" href="/">Home</a></div>
                                    <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                                    <div class='col-auto p-lg-0'><a class="nav-link" href="/subject/?id=` + subject_id + `">` + subject.display_name + `</a></div>
                                    <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                                    <div class='col-auto p-lg-0'><a class="nav-link active" aria-current="page">Level ` + level + `</a></div></div>`);
    } else {
        $("#nav-breadcrumbs").html(`<div class='row'><div class='col-auto pe-lg-0'><a class="nav-link" href="/">Home</a></div>
                                    <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                                    <div class='col-auto p-lg-0'><a class="nav-link active" aria-current="page">` + subject.display_name + `</a></div></div>`);    
    }
    $("#nav-breadcrumbs").fadeIn() // I love this so much
    outhtml = ` <div class="table-responsive">
                <h3 class="mb-1">Standards</h3>
                <table class="table table-bordered table-hover bg-white border-0">
                    <thead>
                        <tr>
                        <th scope="col" class="col text-end">Number</th>
                        <th scope="col" class="col">Title</th>
                        <th scope="col">Type</th>
                        <th scope="col">Credits</th>
                        <th scope="col">Literacy</th>
                        <th scope="col">Numeracy</th>
                        <th scope="col">Int/Ext</th>
                        </tr>
                    </thead>`;
    var level_arr = (level == null) ? [1,2,3] : [level,]
    level_arr.forEach(current_level => { // for each level allowed on the page
        standards_for_level = standards.filter(o => o.level == current_level);
        standards_for_level = standards_for_level.sort((a,b) => (a.standard_number > b.standard_number) - (a.standard_number < b.standard_number)); // sort by standard_number
        if (standards_for_level.length > 0) {
            baseurl = `https://www.nzqa.govt.nz/ncea/assessment/search.do?query=`+subject.name.replace(/\ /g, '+')+`&level=0`+current_level+`&view=`;
            views = [['reports', 'Schedules'], ['exams','Exams'], ['achievements', 'Standards'], ['all', 'All']]
            outhtml += `<thead>
            <tr>
                <th colspan="7" class="text-center border border-dark pb-1">
                    <div class='container px-1'>
                    <div class="row border-bottom pb-2"><div class="col fw-bold fs-3 text-center">Level ` + current_level + `</div></div>
                    <div class="row justify-content-center">`;
            views.forEach(view => { //  add buttons for each view
                outhtml += `<div class='col-auto'><a class="btn btn-link text-decoration-none" target="_blank" href="`+baseurl+view[0]+`">`+view[1]+`</a></div>`;
            });
            outhtml += `</div>
                    </div>
                </th>
            </tr>
            </thead>
            <tbody>`;
            standards_for_level.forEach(standard => { // for each standard
                outhtml += generateStandardRow(standard);
            });
            outhtml += "</tbody>";
        } else {
            outhtml += "<thead><tr><th colspan=7 class='text-center border border-dark'>No standards for Level " + current_level +"</th></tr></thead>";
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
    document.getElementById("searchbox").addEventListener('input', search); // when something is input, search
});
