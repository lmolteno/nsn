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


function getInfo(then=function(){a=1}) { // get the information regarding the standard with the ID from the URL
    $.get("/api/standards?number=" + standard_number.toString(), (data) => {
        if (data.success) {
            console.log("Successfully gathered information about the standard.")
            standard = data;
            $.get("/api/resources?number=" + standard_number, (resources_data) => {
                if (resources_data.success) {
                    console.log("Succesfully gathered resources for the standard");
                    console.log(resources_data.resources);
                    resources = resources_data.resources
                    updateEverything(); // run the next function
                } else {
                    alert("Failure to get resources. Try reloading. If the problem persists, email linus@molteno.net");
                }
            });
        } else {
            alert("Failure to get standard info. Try reloading. If the problem persists, email linus@molteno.net");
        }
    }); 
}

function linkToNZQA(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}

function starSubject(subject_id, element) {
    if (starred.find(s => s.subject_id === subject_id)) { // already starred
        index = starred.findIndex(s => s.subject_id === subject_id); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        element.innerHTML = starFull; // fill star
        subject = standard.subjects.find(s => s.subject_id === subject_id); // get object (from id)
        starred.push(subject); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
}

function unstarSubject(subject_id, element) { // for removing the starred subject, with the event from the starred list
    index = starred.findIndex(s => s.subject_id === subject_id); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displaySubjects();
}

function getStarred() {
    if (window.localStorage.getItem('starred')) { // if this has been done before
        starred = JSON.parse(window.localStorage.getItem('starred')); // update from browser storage (which only stores strings)
    } else {
        window.localStorage.setItem('starred', JSON.stringify(starred)); // initialise with empty array
    }
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
    // construct li element for each subject with a star
    outhtml = ""
    outhtml += "<li class='py-2 list-group-item list-group-item-action'><a type='button' onClick='starSubject("
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
    outhtml += subject.display_name;
    outhtml += "</a></li>"
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
                resources_for_category = resources.filter((resource) => (resource.category == category))
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

function updateEverything() { // populate EVERYTHING hehe
    
    standard_num_text = (standard_number > 90000 ? "AS" : "US") + standard_number; // e.g. AS91902 or US2345 depending on achievement vs unit
    
    // hiding everything so that it's not jumpy when changed
    $('#standard-number').hide()
    $('#standard-title').hide()
    $('#subject-list').hide();

    // create breadcrumbs
    $("#nav-breadcrumbs").hide()
    $("#nav-breadcrumbs").html(`<div class='row'><div class='col-auto pe-lg-0'><a class="nav-link" href="/">Home</a></div>
                                <div class='col-auto p-lg-0'><span class='nav-link disabled'>/</span></div>
                                <div class='col-auto p-lg-0'><a class="nav-link active" aria-current="page">` + standard_num_text + `</a></div></div>`); 
    
    // update headers
    $("#standard-number").html(standard_num_text);
    $("#standard-title").html(standard.basic_info.title);
    
    updateSubjects();
    
    // update contents of literacy/numeracy table
    $('#literacy-bool').html((standard.ncea_litnum.literacy) ? "Yes" : "No");
    $('#numeracy-bool').html((standard.ncea_litnum.numeracy) ? "Yes" : "No");
    $('#reading-bool').html( (standard.ue_literacy.reading)  ? "Yes" : "No");
    $('#writing-bool').html( (standard.ue_literacy.writing)  ? "Yes" : "No");
    
    // update information table
    $('#level-num').html(standard.basic_info.level);
    $('#credit-num').html(standard.basic_info.credits);
    $('#version-num').html(standard.basic_info.version == null ? "Unknown" : standard.basic_info.version );
    // set internal/external colour
//     $("#internal-external").addClass(standard.basic_info.internal ? "internal_row" : "external_row")
    $('#internal-external').html(standard.basic_info.internal ? "Internal" : "External");
    
    // update nzqa link with href to correct bit of site
    $("#all-docs-link").attr("href", "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + standard_number);
    
    $("#resources-container").hide();
    $("#resources-container").html(getResourcesList());
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

$(document).ready(function() {
    // get starred subject
    getStarred();
    if (standard_number >= 90000) {
        sortbycategory = $('#sort-selector').is(':checked'); // set sort to whether this is checked or not
        $("#sort-selector").on("change", sort_handler);
    } else {
        $("#sort-selector-div").addClass('d-none');
    }
    getInfo();
});
