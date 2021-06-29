// globals
subjects = [];
starred = [];
potentially_starred = []; // this is list of the standards that are stored in memory in case they become starred (from search results)
starModal = 0;
top_standard = undefined;
top_subject = undefined;

// for accessing the search engine
const client = new MeiliSearch({
    host: "https://" + window.location.host.toString(),
    apiKey: '',
})

// init search indices
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
                resolve(); 
            } else {
                alert("Failure to get subjects. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data.error)
            }
        });
    });
    return promise
}

function displaySubjects() { // display the current list of subjects
    console.log("Displaying " + subjects.length.toString() + " subjects");
    outhtml = "" // this will be filled with list elements
    subjects.sort((x, y) => {
        if (x.display_name > y.display_name) { return 1; }
        if (x.display_name < y.display_name) { return -1; }
        else { return 0; }
    });
    subjects.forEach(subject => {
        outhtml += generateSubjectLI(subject);
    });
    $("#spinner-subjects").remove();
    $("#subjectlist").html(outhtml);
}

function generateSubjectLI(subject) {
    // construct li element for each subject
    outhtml = `<li class='py-1 row'>
                    -
                    <a class='col link text-decoration-none px-0 mx-2' href=/subject/${subject.subject_id}>
                        ${subject.display_name}
                    </a>
                </li>`
    return outhtml
}

function resolveAmbiguity(standard_number, subject_id) {
    // shallow copy
    var standard = JSON.parse(JSON.stringify(potentially_starred.find(s => s.standard_number == standard_number)));
    standard.subject_id = subject_id;
    starred.push(standard); // add this to the starred list
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    starModal.hide();
    displayStarred(); // update display
    search();
}

function starStandard(standard_number, element) {
    standard = potentially_starred.find(s => s.standard_number == standard_number)
    if (starred.find(s => s.standard_number == standard_number)) { // already starred
        console.log(`Removing ${standard_number}`)
        index = starred.findIndex(s => s.standard_number == standard_number); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        console.log(`Adding ${standard_number}`);
        if (standard.subject_id.length > 1) { // 91361 is a good option
            console.log(`Ambiguity!`)
            outhtml = ""
            standard.subject_id.forEach(s_id => {
                subject = subjects.find(s => s.subject_id == s_id)
                outhtml += `<li><a class='clickable' onClick='resolveAmbiguity(${standard.standard_number}, ${s_id})'>${subject.display_name}</a></li>`
            });
            $("#ambiguousList").html(outhtml);
            starModal.show();
            return;
        } else {
            element.innerHTML = starFull; // fill star
            standard.subject_id = standard.subject_id[0];
        }
        starred.push(standard); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displayStarred(); // update display
    search();
}

function unstarStandard(standard_number, element) { // for removing the starred standard
    console.log(`Removing ${standard_number}`);
    index = starred.findIndex(s => s.standard_number == standard_number); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    element.innerHTML = starOutline; // replace with outline
    displayStarred(); // update display
    search(); // refresh search starred status
}

function getStarred() {
    return new Promise((resolve, reject) => {
        if (window.localStorage.getItem('starred')) { // if this has been done before
            starred = JSON.parse(window.localStorage.getItem('starred')); // update from browser storage (which only stores strings)
        } else {
            window.localStorage.setItem('starred', JSON.stringify(starred)); // initialise with empty array
        }
        resolve();
    });
}

function displayStarred() {
    if (starred.length == 0) {
        $("#starredlist").html(`<p class='text-muted mb-0'>Hit the ${starOutline} icon on a standard to add it here</p>`);
        $("#starredlist svg").addClass("mb-1"); // move the star up a bit, inline with the text
        $("#sharebutton").addClass("disabled") // disable the share button
    } else {
        $("#sharebutton").removeClass("disabled") // re-enable the share button
        outhtml = ""
        // starred is a list of standards, we want to organise by subject then level
        // this is a minimum spanning tree of the tree of:
        //        subject1 subject2
        //            |       |
        //          level   level
        //             \     / 
        //            standard
        // put this in the future, for now we will just have it in the table
        // other option is prompting the user, storing the subject it should be under in the cookies
        // if they access it through a specific subject page, then it's starred as the subject they went through
        outhtml += `<thead>
                        <tr>
                            <th scope="col">Star</th>
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
                    <tbody>`
        // for totals footer
        total_credits = 0
        total_reading = 0
        total_writing = 0
        total_numeracy = 0
        // sort the starred subjects by standard number
        starred = starred.sort((a, b) => (a.standard_number > b.standard_number) - (a.standard_number < b.standard_number))
        
        // generate lists of all unique subjects
        let unique_subjects = [... new Set(starred.map(s => s.subject_id))]; // sets are unique
        unique_subjects.forEach(subject_id => {
            subject = subjects.find(s => s.subject_id == subject_id); // get the subjectname
            subject_name = subject.display_name;
            subject_standards = starred.filter(s => s.subject_id == subject_id); // get standards under this subject
            // generate subject header
            outhtml += `<tr>
                            <td colspan="9" class="text-center border border-dark pb-1">
                                <a href="/subject/${subject_id}" class="text-dark col fw-bold fs-3 text-center">${subject_name}</a>
                            </td>
                        </tr>`;
            subject_standards.forEach(standard => {
                standard.id = standard.standard_number // to suit the search-configured row generation function
                total_credits += standard.credits;
                total_reading += standard.reading ? standard.credits : 0; // either add the number of credits or nothing 
                total_writing += standard.writing ? standard.credits : 0; // depending on the writing/reading credits
                total_numeracy += standard.numeracy ? standard.credits : 0;

                outhtml += generateStandardRow(standard);
            })
        })


        outhtml += `</tbody>`;
        // add row of totals to footer
        outhtml += `<tfoot>
                        <tr class='border-bottom-0'>
                            <th colspan=5 class='border-start-0'>
                                <span class='float-end me-2'>Totals:</span>
                            </th>
                            <td class='text-center'>${total_credits}</td>
                            <td>
                                <span class='float-start'>${total_reading}</span>
                                <span class='float-end'>  ${total_writing}</span>
                            </td>
                            <td class='text-center'>${total_numeracy}</td>
                            <td class='border-end-0'>
                                
                            </td>
                        </tr>
                    </tfoot>`;
        $("#starredlist").html(outhtml);

    }
    $("#spinner-starred").remove();
}

function clearStarred() {
    window.localStorage.setItem('starred', JSON.stringify([])); // initialise with empty array
    starred = [];
    displayStarred();
    search();
}

function generateStandardRow(standard) {
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

async function search() {
    searchtext = $("#searchbox").val()

    // move search icon to spinner
    if ($("#searchicon").html() != spinner) {
        $("#searchicon").html(spinner);
    }

    if (searchtext.length != 0) {

        const subjects = await subjindex.search(searchtext, { limit: 5 })
        if (subjects.hits.length > 0 & $("#searchbox").val().length > 0) {
            subjecthtml = `<h3 class="mb-1">Subjects</h3>
                        <table class="table table-bordered border-0">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                </tr>
                            </thead>
                            <tbody>`;
            subjects['hits'].forEach(result => {
                subjecthtml += `<tr>
                                    <td>
                                        <a href='/subject/${result.id}' class='text-decoration-none link'>${result.display_name}</a>
                                    </td>
                                </tr>`;
            });
            top_subject = subjects['hits'][0]; // update most relevant subject
            subjecthtml += "</tbody></table>"
            $("#subjects-results").html(subjecthtml)
            $("#search-results").css("visibility", "visible");
        } else {
            $("#subjects-results").html("");
            top_subject = undefined; // ignore subject in handleSubmit
        }

        const standards = await standindex.search(searchtext, { limit: 5 })
        if (standards['hits'].length > 0 & $("#searchbox").val().length > 0) {

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
            standards['hits'].forEach(result => {
                // add to potentially_starred list with the correct id/standard_number key replacement
                // this is for accessing from the handleSearchSubmit and starring functions in case these are handled
                potential = result
                potential.standard_number = result.id
                potentially_starred.push(potential);
                if (potentially_starred.length > 100) {
                    potentially_starred.shift() // removes the first element of the array, this keeps the length below 100 as i keep this list updated async
                }
                standardshtml += generateStandardRow(result)
            });
            top_standard = standards['hits'][0]; // update top hit, to be the first one
            standardshtml += "</tbody></table>"
            $("#standards-results").html(standardshtml)
            $("#search-results").css("visibility", "visible");
        } else {
            $("#standards-results").html("");
            top_standard = undefined;// update top hit, to be undefined (ignored in handleSubmit)
        }

        if ($("#searchbox").val().length == 0) { // recheck the box after all the awaits, just in case things have changed (#3)
            $("#subjects-results").html("")
            $("#standards-results").html("")
            $("#search-results").css("visibility", "hidden");
        } else {
            if (subjects.hits.length == 0 && standards.hits.length == 0) {
                $("#subjects-results").html("<p class='text-muted mb-2'>No results found</p>")
                $("#search-results").css("visibility", "visible");
            }
        }
        // reset to a magnifying glass
        reset_searchicon();
    } else {
        $("#subjects-results").html("")
        $("#standards-results").html("")
        $("#search-results").css("visibility", "hidden");
        reset_searchicon();
    }
}

let reset_searchicon = 
    $.debounce(500, false, () => {
        $("#searchicon").html(magnifying_glass);
    });

function handleSearchSubmit() {
    var searchTerm = $("#searchbox").val();
    var matching_standard = potentially_starred.find(s => s.standard_number == searchTerm); // check if standard number matches
    if (matching_standard != undefined) {
        // go to matching standard
        window.location.href = '/standard/' + matching_standard.standard_number;
        return false;
    }
    var matching_subject = subjects.find(s => s.display_name.toLowerCase() == searchTerm.toLowerCase())
    if (matching_subject != undefined) {
        // go to matching subject
        window.location.href = '/subject/' + matching_subject.subject_id;
        return false; // skip the rest of the function
    }
    // go to top hit
    if (top_subject != undefined) {
        // go to subject (it's above standards)
        window.location.href = '/subject/' + top_subject.id;
        return false;   
    }
    if (top_standard != undefined) {
        window.location.href = '/standard/' + top_standard.id;
        return false;
    }
    return false; // don't get the default function to redirect to /
}

function linkToAssessment(number) {
    nzqaurl = "https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber=" + number.toString()
    window.open(nzqaurl, '_blank')
}

function encode64(dec, padding=3) {
    let charstring = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; // described in comments in #24
    var result = '';
    var residual = dec; // the amount left over
    while (true) {
        result = charstring.charAt(residual % 64) + result; // add to the start of the result string
        residual = Math.floor(residual / 64); // get the remainder
        if (residual === 0) {
            break;
        }
    }

    // do the padding
    result = result.padStart(padding, charstring.charAt(0)); // add A at the beginning until it's <padding> characters long

    return result;
}

function copyShareLink() {
    url = $("#shared-url").val();
    navigator.clipboard.writeText(url).then(function() {
        console.log(`copied ${url} to clipboard!`);
    }, function(err) {
        console.error('couldn\'t copy!: ', err);
    });
}

function updateShareLink() {
    title = $("#shared-title").val();
    sharelink = `https://${window.location.host}/share/?n=`
    // generate lists of all unique subjects
    let unique_subjects = [... new Set(starred.map(s => s.subject_id))]; // sets are unique
    unique_subjects.forEach(subject_id => { // for each subject
        subject = subjects.find(s => s.subject_id == subject_id); // get the subject name
        subject_name = subject.display_name;
        subject_standards = starred.filter(s => s.subject_id == subject_id); // get standards under this subject
        sharelink += encode64(subject_id, 1) + "." // 1 character padding
        subject_standards.forEach((standard) => { // for each standard
            sharelink += encode64(standard.standard_number);
        });
        sharelink += ".";
        // the format of the share link is now ?n=<subjectid>.<standard><standard>.<subjectid>.<standard><standard>.&t=<title>
    });

    sharelink += "&t=" + encodeURIComponent(title); // encodeURIComponent makes sure that reserved characters are represented using percent encoding
    $('#shared-url').val(sharelink);
    $("#go-to-share").attr('href', sharelink);
}


$(document).ready(function () {
    getSubjects().then(displaySubjects).then(getStarred).then(displayStarred); // update subject list and starred standard list
    $("#searchbox").val("") // reset value
    $("#searchform").submit(handleSearchSubmit); // set submit handler
    document.getElementById("searchbox").addEventListener('input', $.throttle(500, search)); // when something is input, search

    $("#shared-title").on("input", updateShareLink);
    $('#shareModal').on('show.bs.modal', updateShareLink)
    starModal = new bootstrap.Modal(document.getElementById('starModal'));
});
