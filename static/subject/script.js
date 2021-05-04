// globals
subjects = [];
standards = [];
starred = [];


const urlParams = new URLSearchParams(window.location.search); // get url parameters
if (urlParams.get('id') == null) {
    window.location = "/"; // if there's no id parameter in the url
}
// get level in url parameters, else null (inline ifs can be confusing sorry)
const level = (urlParams.get('level') == null) ? null : parseInt(urlParams.get('level'));
const subject_id = parseInt(urlParams.get('id'));
var subject = 0; // for init of the global subject object

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
    let promise = new Promise((resolve, reject) => {
        $.get("/api/subjects", function (data) { // send a get request to my api
            if (data.success) {
                console.log("Successfully gathered " + data['subjects'].length.toString() + " subjects");
                subjects = data['subjects'];
                resolve()
            } else {
                alert("Failure to get subjects. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data.error)
            }
        })
    });
    return promise
}

function getStandards() { // get the list of standards for the subject
    let promise = new Promise((resolve, reject) => {
            $.get("/api/standards?subject=" + subject_id, (data) => {
            if (data.success) {
                console.log("Successfully gathered " + data.standards.length.toString() + " standards");
                standards = data.standards;
                resolve()
            } else {
                alert("Failure to get standards. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data,error)
            }
        });
    });
    return promise
}


function starStandard(standard_number, element) {
    standard = standards.find(s => s.standard_number == standard_number)
    if (starred.find(s => s.standard_number === standard_number)) { // already starred
        index = starred.findIndex(s => s.standard_number == standard_number); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        element.innerHTML = starFull; // fill star
        starred.push(standard); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    search();
}

function unstarStandard(standard_number, element) { // for removing the starred standard
    index = starred.findIndex(s => s.standard_number == standard_number); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    search(); // refresh search starred status
}

function getStarred(then = () => { a = 1 }) {
    if (window.localStorage.getItem('starred')) { // if this has been done before
        starred = JSON.parse(window.localStorage.getItem('starred')); // update from browser storage (which only stores strings)
    } else {
        window.localStorage.setItem('starred', JSON.stringify(starred)); // initialise with empty array
    }
    then();
}

async function search() {
    searchtext = $("#searchbox").val()

    if (searchtext.length != 0) {
        searched_standards = await standindex.search(searchtext, { limit: 100 })
        if (searched_standards['hits'].length > 0) {
            var filtered = []
            // for all of the hits, check if they're in the list of standards for this subject
            searched_standards['hits'].forEach(result => {
                if (standards.find(o => o.standard_number == result.id) && filtered.length < 5) {
                    filtered.push(result)
                }
            })
            standardshtml = `<h3 class="mb-1">Standards</h3>

                        <table class="table-bordered border-0 table table-hover">
                            <thead>
                                <tr>
                                    <th scope="col" class="col">Star</th>
                                    <th scope="col" class="col text-end">Number</th>
                                    <th scope="col" class="col">Title</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Level</th>
                                    <th scope="col">Credits</th>
                                    <th scope="col"><a href='/about/#literacy' class='text-dark'>Literacy</a></th>
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
                standardshtml = "<p class='text-muted mb-2'>No results found</p>";
            }
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility", "visible");
        } else {
            standardshtml = "<p class='text-muted mb-2'>No results found</p>";
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility", "visible");
        }


        if ($("#searchbox").val().length == 0) { // recheck the box after all the awaits, just in case things have changed (#3)
            $("#subjects-results").html("")
            $("#standards-results").html("")
            $("#search-results").css("visibility", "hidden");
        } else {
            $("#search-results").css("visibility", "visible");
        }
    } else {
        $("#standards-results").html("")
        $("#search-results").css("visibility", "hidden");
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
    is_starred = starred.find((searched) => searched.standard_number == standard.id)
    stretchedlinkstr = `<a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>`;

    outhtml += "<tr class='clickable " + i_e_class + "'>" // initialise row

    // add the star standard button, depending on whether it's starred or not
    outhtml += `    <th scope='row' style='position: relative;'>
                        <a onClick='${is_starred ? "unstar" : "star"}Standard(${standard.id}, this)' class='stretched-link link text-decoration-none text-dark text-center d-block'>
                            ${is_starred ? starFull : starOutline}
                        </a>
                    </th>`
    // add <th> (header) styled standard number with link to the standard page
    outhtml += `    <th scope='row' style='position: relative;'>
                        ${stretchedlinkstr}
                        <span class='float-end'>` + standard.id + `</span>
                    </th>`

    // add all the other information in <td> styled boxes
    outhtml += `    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.title + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + ((parseInt(standard.id) < 90000) ? "Unit" : "Achievement") + `
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.level + `
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.credits + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        <span class='float-start'>` + (standard.reading ? "R" : " ") + `</span>
                        <span class='float-end'>` + (standard.writing ? "W" : " ") + `</span>
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + (standard.numeracy ? "Y" : " ") + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
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
    // this hide, set html, fadein idiom comes through a lot
    $("#subject-name").hide()
    $("#subject-name").html(subject.display_name);
    $("#subject-name").fadeIn()

    /* update page title */
    title = `NCEA ${subject.display_name} Standards`;
    if (document.title != title) {
        document.title = title;
    }
    $('meta[name="description"]').attr("content", `Standards relating to ${subject.display_name}`);

    $("#searchbox").attr("placeholder", "Search " + subject.display_name + " standards");

   
    navhtml = `<div class='row'><div class='col-auto pe-lg-0'><a class="nav-link" href="/">Home</a></div>
               <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
               <div class='col-auto p-lg-0'><a class="nav-link" href="/subject/?id=` + subject_id + `">` + subject.display_name + `</a></div>`;
    if (level != null) { // add the "/ level 1" if the level is there
        navhtml += `<div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                    <div class='col-auto p-lg-0'><a class="nav-link active" aria-current="page">Level ` + level + `</a></div>`;
    }
    navhtml += `</div>`
    
    $("#nav-breadcrumbs").hide()
    $("#nav-breadcrumbs").html(navhtml)
    $("#nav-breadcrumbs").fadeIn()

    outhtml = ` <div class="table-responsive">
                <h3 class="mb-1">Standards</h3>
                <table class="table table-bordered table-hover bg-white border-0">
                    <thead>
                        <tr>
                            <th scope="col" class="col">Star</th>
                            <th scope="col" class="col text-end">Number</th>
                            <th scope="col" class="col">Title</th>
                            <th scope="col">Type</th>
                            <th scope="col">Level</th>
                            <th scope="col">Credits</th>
                            <th scope="col"><a href='/about/#literacy' class='text-dark'>Literacy</a></th>
                            <th scope="col">Numeracy</th>
                            <th scope="col">I/E</th>
                        </tr>
                    </thead>`;

    var level_arr = (level == null) ? [1, 2, 3] : [level,]
    level_arr.forEach(current_level => { // for each level allowed on the page
        standards_for_level = standards.filter(o => o.level == current_level);
        standards_for_level = standards_for_level.sort((a, b) => (a.standard_number > b.standard_number) - (a.standard_number < b.standard_number)); // sort by standard_number
        if (standards_for_level.length > 0) {
            baseurl = `https://www.nzqa.govt.nz/ncea/assessment/search.do?query=` + subject.name.replace(/\ /g, '+') + `&level=0` + current_level + `&view=`;
            views = [['reports', 'Schedules'], ['exams', 'Exams'], ['achievements', 'Standards'], ['all', 'All']]
            outhtml += `<thead>
            <tr>
                <th colspan="9" class="text-center border border-dark pb-1">
                    <div class='container px-1'>
                    <div class="row border-bottom pb-2"><div class="col fw-bold fs-3 text-center">Level ` + current_level + `</div></div>
                    <div class="row justify-content-center">`;
            views.forEach(view => { //  add buttons for each view
                outhtml += `<div class='col-auto'><a class="btn btn-link text-decoration-none" target="_blank" href="` + baseurl + view[0] + `">` + view[1] + `</a></div>`;
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
            outhtml += "<thead><tr><th colspan=7 class='text-center border border-dark'>No standards for Level " + current_level + "</th></tr></thead>";
        }
    });
    outhtml += "</tbody></table></div>";

    $("#main-container").hide();
    $("#main-container").html(outhtml);
    $("#main-container").fadeIn();
}


$(document).ready(function () {
    getStarred();
    getSubjects()
        .then(getStandards)
        .then(updateEverything); // using promises to get synchronisity among multiple functions
    $("#searchbox").val("");
    search();
    document.getElementById("searchbox").addEventListener('input', search); // when something is input, search
});
