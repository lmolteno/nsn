// globals
subjects = [];
content = [];
standards = [];
starred = [];
top_result = undefined;

const urlParams = new URLSearchParams(window.location.search); // get url parameters
var subject_id = parseInt(urlParams.get('id'));
var level = (urlParams.get('level') == null) ? null : parseInt(urlParams.get('level'));
// this is cursed, but apparently a number that = NaN != NaN, but if you convert it to a string, they're equal

if (subject_id.toString() == "NaN") {
    // if there's no id parameter in the url
    // check to see if the end path is not equal to 'subjects' (this is for handling things like /subject/41, in issue #22
    // bit of a mess, let me explain:
    // get the window location pathname, split at every '/' (.split())
    // then filter it so that none of the elements of that array are empty (.filter())
    // then take the last element (.pop())
    // and compare it with subjects
    pathElements = window.location.pathname.split("/").filter(s=>s!='')
    endOfPath = pathElements.pop() 
    secondLastOfPath = pathElements.pop() // get second last, in case of levels
    if (endOfPath != 'subject') { // it can either be a subject or level at the end
        if (secondLastOfPath != 'subject') { // it must be a /subject/id/level URL
            secondLastOfPath = parseInt(secondLastOfPath)
            if (secondLastOfPath.toString() == "NaN") {
                console.log("redirecting... because of malformed subject")
                window.location = '/';
            } else {
                subject_id = secondLastOfPath
                // then try the level
                endOfPath = parseInt(endOfPath) 
                if (endOfPath.toString() == "NaN") {
                    console.log("redirecting... because of malformed level")
                    window.location = "/"; // redirect home
                } else {
                    level = endOfPath;
                }
            }
        } else { // it must be a /subject/id URL (no level)
            endOfPath = parseInt(endOfPath)
            if (endOfPath.toString() == "NaN") {
                console.log("redirecting...")
                window.location = "/"; // redirect home
            } else {
                subject_id = endOfPath;
            }
        }
    }
} 

var subject = 0; // for init of the global subject object

// for accessing the search engine
const client = new MeiliSearch({
    host: "https://" + window.location.host,
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

const magnifying_glass = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
<svg>`;

const spinner = `<div class="spinner-border spinner-border-sm fs-6" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`

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
                reject(data.error)
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
    
    // move search icon to spinner
    $("#searchicon").html(spinner);

    if (searchtext.length != 0) {
        options = {
            limit: 5,
            filters: `subject_id = ${subject_id}` // i hope this is okay with arrays
        }
        searched_standards = await standindex.search(searchtext, options) 
        if (searched_standards['hits'].length > 0) {
            standardshtml = `<h4 class="mb-1">Search Results:</h4>

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

            searched_standards['hits'].forEach(result => {
                standardshtml += generateSearchStandardRow(result)
            })
            top_result = searched_standards['hits'][0]; // update top result for handlesubmit
            standardshtml += "</tbody></table>"
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility", "visible");
        } else {
            standardshtml = "<p class='text-muted mb-2'>No results found</p>";
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility", "visible");
            top_result = undefined;
        }


        if ($("#searchbox").val().length == 0) { // recheck the box after all the awaits, just in case things have changed (#3)
            $("#subjects-results").html("")
            $("#standards-results").html("")
            $("#search-results").css("visibility", "hidden");
        } else {
            $("#search-results").css("visibility", "visible");
        }
        // reset to a magnifying glass
        $("#searchicon").html(magnifying_glass);
    } else {
        $("#standards-results").html("")
        $("#search-results").css("visibility", "hidden");
        $("#searchicon").html(magnifying_glass);
    }
}

function generateSearchStandardRow(standard) {
    outhtml = ""
    i_e_class = standard.internal ? "internal_row" : "external_row"; // class for internal vs external colouring
    is_starred = starred.find((searched) => searched.standard_number == standard.id)
    stretchedlinkstr = `<a href='/standard/${standard.id}' class='stretched-link link'></a>`;

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
    // replaced with the standard number 
    outhtml = ""
    i_e_class = standard.internal ? "internal_row" : "external_row"; // class for internal vs external colouring
    is_starred = starred.find((searched) => searched.standard_number == standard.id)
    stretchedlinkstr = `<a href='/standard/${standard.id}' class='stretched-link link'></a>`;

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

function getCustomContent() {
    let promise = new Promise((resolve, reject) => {
        $.get(`/api/content?id=`+subject_id, function (data) { // send a get request to my api
            if (data.success) {
                console.log("Successfully gathered custom content");
                content = data['content'];
                resolve()
            } else {
                //alert("Failure to get custom content. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data.error)
            }
        })
    });
    return promise
}

function generateCustomHtml(level = null) {
    elements = content.filter(el => el.level == level)
    if (elements.length == 0) {
        return ""
    } else {
        // concatenate them into a listerino
        return  `<div class='row justify-content-center'>
                     ${elements.map(el => `<div class='col-auto text-center'>${el.html}</div>`).join("")}
                   </div>`;
    }
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
               <div class='col-auto p-lg-0'><a class="nav-link active" href="/subject/${subject_id}">${subject.display_name}</a></div>`;
    if (level != null) { // add the "/ level 1" if the level is there
        navhtml += `<div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                    <div class='col-auto p-lg-0'><a class="nav-link active" aria-current="page">Level ${level}</a></div>`;
    }
    navhtml += `</div>`
    
    $("#nav-breadcrumbs").hide()
    $("#nav-breadcrumbs").html(navhtml)
    $("#nav-breadcrumbs").fadeIn()

    outhtml = ` <table class="table table-bordered table-hover bg-white border-0">
                    <thead>
                        <tr>
                            <th scope="col" class="col">Star</th>
                            <th scope="col" class="col text-end">Number</th>
                            <th scope="col" class="col">Title</th>
                            <th scope="col">Type</th>
                            <th scope="col">Credits</th>
                            <th scope="col"><a href='/about/#literacy' class='text-dark'>Literacy</a></th>
                            <th scope="col">Numeracy</th>
                            <th scope="col">I/E</th>
                        </tr>
                    </thead>`;

    // update custom general content
    generalHtml = generateCustomHtml(); // not passing a level parameter gives the general html
    $("#custom-general-container").html(generalHtml)
    if (generalHtml.length > 0) {
        $("#custom-general-container").addClass("my-2")
    }

    var level_arr = (level == null) ? [1, 2, 3] : [level,]
    level_arr.forEach(current_level => { // for each level allowed on the page
        standards_for_level = standards.filter(o => o.level == current_level);
        standards_for_level = standards_for_level.sort((a, b) => (a.standard_number > b.standard_number) - (a.standard_number < b.standard_number)); // sort by standard_number
        if (standards_for_level.length > 0) {
            customHtml = generateCustomHtml(current_level);
            outhtml += `<thead>
            <tr>
                <th colspan="8" class="border border-dark pb-1">
                    <div class='container px-1'>
                    <div class="row ${customHtml.length > 0 ? "border-bottom pb-2" : ""}"><div class="col text-center fw-bold fs-3">Level ${current_level}</div></div>
                    <div class="mt-2">${generateCustomHtml(current_level)}</div>
                </th>
            </tr>
            </thead>
            <tbody>`;
            standards_for_level.forEach(standard => { // for each standard
                outhtml += generateStandardRow(standard);
            });
            outhtml += "</tbody>";
        } else {
            outhtml += "<thead><tr><th colspan='8' class='text-center border border-dark'>No standards for Level " + current_level + "</th></tr></thead>";
        }
    });
    outhtml += "</tbody></table>";

    $("#main-container").hide();
    $("#main-container").html(outhtml);
    $("#main-container").fadeIn();
}

function handleSearchSubmit() {
    var searchTerm = $("#searchbox").val();
    var matching_standard = standards.find(s => s.standard_number == searchTerm); // check if standard number matches
    if (matching_standard != undefined) {
        // go to matching standard
        window.location.href = '/standard/' + matching_standard.standard_number;
        return false;
    }
    if (top_result != undefined) {
        window.location.href = '/standard/' + top_result.id;
        return false;
    }
    return false; // don't get the default function to redirect to /
}

$(document).ready(function () {
    getStarred();
    getSubjects()
        .then(getCustomContent)
        .then(getStandards)
        .then(updateEverything); // using promises to get synchronisity among multiple functions
    $("#searchbox").val("");
    search();
    $("#searchform").submit(handleSearchSubmit); // update submit handler
    document.getElementById("searchbox").addEventListener('input', search); // when something is input, search
});
