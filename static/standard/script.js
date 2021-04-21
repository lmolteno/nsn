// globals
standard = {};
standard_number = null;
resources = [];
starred = [];
sortbycategory = false; // sorting of resource
const urlParams = new URLSearchParams(window.location.search); // get url parameters
if (urlParams.get('num') == null) {
    window.location = "/"; // if there's no id parameter in the url
} else {
    standard_number = urlParams.get('num')
}

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


function getInfo(then = function () { a = 1 }) { // get the information regarding the standard with the ID from the URL
    let promise = new Promise((resolve, reject) => {
        $.get("/api/standards?number=" + standard_number.toString(), (data) => {
            if (data.success) {
                console.log("Successfully gathered information about the standard.")
                standard = data;
                resolve();
            } else {
                alert("Failure to get standard info. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data.error);
            }
        });
    });
    return promise
}

function getResources() {
    let promise = new Promise((resolve, reject) => {
        $.get("/api/resources?number=" + standard_number, (resources_data) => {
            if (resources_data.success) {
                console.log("Succesfully gathered resources for the standard");
                resources = resources_data.resources
                resolve();
                updateEverything(); // run the next function
            } else {
                alert("Failure to get resources. Try reloading. If the problem persists, email linus@molteno.net");
                reject(resources_data.error)
            }
        });
    });
    return promise
}

function linkToNZQA(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}
function starStandard(standard_number, element) {
    standard_to_star = standard.basic_info

    // update it to match what the browser storage should have
    standard_to_star.reading = standard.ue_literacy.reading
    standard_to_star.writing = standard.ue_literacy.writing
    standard_to_star.numeracy = standard.ncea_litnum.numeracy
    standard_to_star.literacy = standard.ncea_litnum.literacy

    console.log(`Adding ${standard_number}`);
    if (starred.find(s => s.standard_number === standard_number)) { // already starred
        index = starred.findIndex(s => s.standard_number == standard_number); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        element.innerHTML = starFull; // fill star
        starred.push(standard_to_star); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    update_star(); // update displayed star
}

function unstarStandard(standard_number, element) { // for removing the starred standard
    console.log(`Removing ${standard_number}`);
    index = starred.findIndex(s => s.standard_number == standard_number); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    update_star(); // update display
}

function getStarred(then = () => { a = 1 }) {
    if (window.localStorage.getItem('starred')) { // if this has been done before
        starred = JSON.parse(window.localStorage.getItem('starred')); // update from browser storage (which only stores strings)
    } else {
        window.localStorage.setItem('starred', JSON.stringify(starred)); // initialise with empty array
    }
    then();
}

function updateSubjects() {
    // add subjects
    subject_list_html = ""
    standard.subjects.forEach((subject) => {
        subject_list_html += generateSubjectLI(subject)
    });

    $('#subject-list').html(subject_list_html);
}

function generateSubjectLI(subject) {
    // construct li element for each subject
    outhtml = `<li class='py-2 list-group-item list-group-item-action'>
                    <a class='col link text-decoration-none px-0 ms-1 me-2' href=/subject/?id=${subject.subject_id}>
                        ${subject.display_name}
                    </a>
                </li>`
    return outhtml
}

function getResourcesList() {
    console.log("Updating resource list")
    outhtml = ""

    if (standard.basic_info.internal) {
        // check and see if there's an annotated exemplar
        exemplar = resources.find(el => el.category == 'annotated-exemplars')
        if (exemplar == undefined) {
            // disable button
            $("#annotated-exemplar-link").addClass('disabled');
        } else {
            $("#annotated-exemplar-link").attr('href', exemplar.nzqa_url);
        }
    } else {
        $("#annotated-exemplar-div").fadeOut();
        $("#annotated-exemplar-div").hide();
        $("#links-row").removeClass("row-cols-md-3");
        $("#links-row").addClass("row-cols-md-2");

    }

    if (standard_number < 90000) { // unit standards only have one document
        if (resources.length == 1) {
            console.log("Updating for unit standard");
            resource = resources[0]
            // add the link to the most unit standard
            $("#recent-standard-link").html("Unit Standard");
            $("#recent-standard-link").attr("href", resource.nzqa_url);
        } else {

        }
    } else { // achievement standard
        if (sortbycategory) {
            all_categories = new Set();
            most_recent_achievement = null;    // for getting the most recent achievement standard
            resources.forEach((resource) => {
                if (resource.year > most_recent_achievement) {
                    most_recent_achievement = resource;
                }
                all_categories.add(resource.category) // sets only contain unique elements, duplicates are removed
            });

            // add the link to the most recent achievement standard
            if (most_recent_achievement != null) {
                $("#recent-standard-link").html("Most Recent Achievement Standard");
                $("#recent-standard-link").attr("href", most_recent_achievement.nzqa_url);
            }

            all_categories.forEach((category) => {
                // filter resources by category
                resources_for_category = resources.filter((resource) => (resource.category == category))
                // sort resources by year (they should already be like this but I want to make sure) reversed because we want 2021 first
                resources_for_category = resources.sort((a, b) => (a.year > b.year) - (a.year < b.year)).reverse()

                category_names = {
                    "achievements": "Achievement Standards",
                    "reports": "Assessment Reports",
                    "exams": "Exams",
                    "exemplars": "Exemplars",
                    "schedules": "Assessment Schedules",
                    "unit": "Unit Standards",
                    "pep": "Profiles of Expected Performance",
                    "annotated-exemplars": "Annotated Exemplars"
                }

                // add card for each cateogry
                outhtml += `<div class='col'>    
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class='mb-0'>${category_names[category]}</h3>
                                    </div>
                                    <ul class='list-group list-group-flush'>`
                resources_for_category.forEach((resource) => {
                    // add link for each resource
                    outhtml += `<a class='list-group-item' href='${resource.nzqa_url}'>${resource.title}</a>`

                });
                outhtml += `        </ul>
                                </div>
                            </div>`
            });

        } else {
            all_years = new Set()
            most_recent_achievement = null; // for getting the most recent achievement standard
            resources.forEach((resource) => {
                if (resource.year > most_recent_achievement && resource.category == "achievements") {
                    most_recent_achievement = resource;
                }
                if (resource.year != 0) {
                    all_years.add(resource.year) // sets only contain unique elements, duplicates are removed
                }
            });

            // add the link to the most recent achievement standard
            if (most_recent_achievement != null) {
                $("#recent-standard-link").html("Most Recent Achievement Standard");
                $("#recent-standard-link").attr("href", most_recent_achievement.nzqa_url);
            }
            // iterate over the sorted, reversed list of years (sets can't be sorted, so i moved it to an array)
            Array.from(all_years).sort().reverse().forEach((year) => {
                // filter resources by year
                resources_for_year = resources.filter((resource) => (resource.year == year))
                // add card for each year
                outhtml += `<div class='col'>    
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class='mb-0'>${year}</h3>
                                    </div>
                                    <ul class='list-group list-group-flush'>`
                resources_for_year.forEach((resource) => {
                    // add link for each resource
                    outhtml += `<a class='list-group-item' href='${resource.nzqa_url}'>${resource.title}</a>`

                });
                outhtml += `        </ul>
                                </div>
                            </div>`
            });
        }
    }

    return outhtml
}

function update_star() {
    is_starred = starred.find(s => s.standard_number == standard_number)
    star = is_starred ? starFull : starOutline;
    title_link = $("#title-star")
    title_link.html(star);
    title_link.children().addClass("mb-2 mb-md-3 clickable");
    size = "0.9em"
    title_link.children().attr("width", size);
    title_link.children().attr("height", size);
    title_link.attr('onclick', `${is_starred ? "unstar" : "star"}Standard(${standard_number}, this)`);
}

function updateEverything() { // populate EVERYTHING hehe

    standard_num_text = (standard_number > 90000 ? "AS" : "US") + standard_number; // e.g. AS91902 or US2345 depending on achievement vs unit
    is_starred = starred.find(s => s.standard_number == standard_number) // check whether or not there's a starred standard
    star = is_starred ? starFull : starOutline; // decide which svg to use based on whether it's starred or not

    // update page title
    title = `Standard ${standard_num_text}`;
    if (document.title != title) {
        document.title = title;
    }
    $('meta[name="description"]').attr("content", standard.basic_info.title);

    // hiding everything so that it's not (too) jumpy when changed
    $('#standard-number').hide()
    $('#standard-title').hide()
    $('#subject-list').hide();
    $("#resources-container").hide();
    $("#nav-breadcrumbs").hide()

    // create breadcrumbs
    $("#nav-breadcrumbs").html(`<div class='row'>
                                    <div class='col-auto pe-lg-0'><a class="nav-link" href="/">Home</a></div>
                                    <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                                    <div class='col-auto p-lg-0'>
                                        <a class="nav-link active" aria-current="page">${standard_num_text}</a>
                                    </div>
                                </div>`);

    // update headers
    $("#standard-number").html(`${standard_num_text} <span id='title-star' onClick="${is_starred ? "unstar" : "star"}Standard(${standard_number}, this)">${star}</span>`);
    update_star();
    $("#standard-title").html(standard.basic_info.title);

    updateSubjects();

    // update contents of literacy/numeracy table
    $('#literacy-bool').html((standard.ncea_litnum.literacy) ? "Yes" : "No");
    $('#numeracy-bool').html((standard.ncea_litnum.numeracy) ? "Yes" : "No");
    $('#reading-bool').html((standard.ue_literacy.reading) ? "Yes" : "No");
    $('#writing-bool').html((standard.ue_literacy.writing) ? "Yes" : "No");

    // update information table
    $('#level-num').html(standard.basic_info.level);
    $('#credit-num').html(standard.basic_info.credits);
    $('#version-num').html(standard.basic_info.version == null ? "Unknown" : standard.basic_info.version);
    $('#internal-external').html(standard.basic_info.internal ? "Internal" : "External");

    // update nzqa link with href to correct bit of site
    $("#all-docs-link").attr("href", "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + standard_number);

    // update resources container content
    $("#resources-container").html(getResourcesList());
    
    // fade in all the now-set elements
    $("#resources-container").fadeIn();
    $('#subject-list').fadeIn();
    $('#standard-number').fadeIn()
    $('#standard-title').fadeIn()
    $("#nav-breadcrumbs").fadeIn()
    $("#main-container").fadeIn();
}

function sort_handler() {
    sortbycategory = $(this).is(':checked'); // set sort to whether this is checked or not

    $("#resources-container").fadeOut('normal', () => {
        $("#resources-container").html(getResourcesList()); // update list of resources
        $("#resources-container").fadeIn();
    });
}

$(document).ready(function () {
    // get starred standards
    getStarred();
    if (standard_number >= 90000) { // if it's an achievement standard
        sortbycategory = $('#sort-selector').is(':checked'); // set sort to whether this is checked or not
        $("#sort-selector").on("change", sort_handler);
    } else { // if it's a unit standard, the only documents are the unit standard, which don't have a year history
        $("#sort-selector-div").addClass('d-none');
    }

    // get all the info
    getInfo().then(getResources).then(updateEverything);

});
