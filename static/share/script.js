// define the globals
var standards = []
var starred = []
var subject_groups = [];

const urlParams = new URLSearchParams(window.location.search); // get url parameters

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



function getListFromURL() {
    var standardNumbers = urlParams.get('n')

    if (standardNumbers == null || standardNumbers == "") {
        window.location = "/"; // if there's no n parameter in the url, redirect to home, which is a safe bet
    }

    subject_groups = standardNumbers.match(/[^\.]+\.[^\.]+/g); // regex magic splits at every second .
    subject_groups = subject_groups.map((str) => {
        console.log(str);
        both = str.split(".")
        subject_id = decode64(both[0])
        standard_numbers = both[1]
                    .match(/.{3}/g) // regex magic split the string into size 3
                    .map(decode64); // decode them all
        return {'subject_id': subject_id, 'standard_numbers': standard_numbers}
    });
    return subject_groups 
}

function getTitle() {
    var titlefromurl = urlParams.get('t');
    if (titlefromurl == null || titlefromurl == '') {
        return "Standard List"
    } else {
        return titlefromurl
    }
}

function getInfo() {
    subject_groups = getListFromURL();
    console.log(`Getting standards `)
    var standardNumbers = subject_groups.map(group => group.standard_numbers);
    var standardstring = standardNumbers.flat().join(".") // as in the backend, these have to be full-stop separated
    console.log(standardstring);
    let promise = new Promise((resolve, reject) => {
        $.get("/api/standards?number=" + standardstring, function (data) { // send the get request to the API
            if (data.success) {
                if (standardNumbers.flat().length == 1) {
                    console.log("Successfully gathered one standard");
                    standards = [data]
                } else {
                    console.log("Successfully gathered " + data.standards.length + " standards");
                    standards = data.standards
                }
                resolve(); 
            } else {
                alert("Failure to get standards. Try reloading. If the problem persists, email linus@molteno.net");
                reject(data.error)
            }
        });
    });
    return promise
}

function displayStandards() {
    outhtml = ""
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
                </thead>`;
    // for totals footer
    total_credits = 0
    total_reading = 0
    total_writing = 0
    total_numeracy = 0

    subject_groups.forEach(s_gr => {
        // find the subject name
        var firstStandard = standards.find(s => s.basic_info.standard_number == s_gr.standard_numbers[0])
        subject = firstStandard.subjects.find(s => s.subject_id == s_gr.subject_id)
        // generate subject header
        outhtml += `<tr>
                        <td colspan="9" class="text-center border border-dark pb-1">
                            <a href="/subject/?id=${s_gr.subject_id}" class="text-dark col fw-bold fs-3 text-center">${subject.display_name}</a>
                        </td>
                    </tr>`;
        s_gr.standard_numbers.forEach(num => {
            standard = standards.find(s => s.basic_info.standard_number == num);
            

            standard.id = standard.basic_info.standard_number // to suit the search-configured row generation function (i reuse it a lot)
            total_credits += standard.basic_info.credits;
            total_reading += standard.ue_literacy.reading ? standard.basic_info.credits : 0; // either add the number of credits or nothing 
            total_writing += standard.ue_literacy.writing ? standard.basic_info.credits : 0; // depending on the writing/reading credits
            total_numeracy += standard.ncea_litnum.numeracy ? standard.basic_info.credits : 0;

            outhtml += generateStandardRow(convertStandard(standard));
        });
    });

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
    
    $(".spinner").remove(); 
    $("#sharedList").html(outhtml);

}

function updateHeader() {
    var title = getTitle();
    // update page title
    if (document.title != `${title} | NSN`) {
        document.title = `${title} | NSN`;
    }
    $('meta[name="description"]').attr("content", title);

    $("#heading").html(title);
}

function convertStandard(standard) {
    // convert the /api/standard?num= format to the starred standard format, which is...
    // credits
    // internal
    // level
    // title
    // version
    // literacy/numeracy/reading/writing
    // standard_number
    // field_id, subfield_id, domain_id

    standard.credits = standard.basic_info.credits
    standard.internal = standard.basic_info.internal
    standard.level = standard.basic_info.level
    standard.title = standard.basic_info.title
    standard.version = standard.basic_info.version
    standard.literacy = standard.ncea_litnum.literacy
    standard.numeracy = standard.ncea_litnum.numeracy
    standard.reading = standard.ue_literacy.reading
    standard.writing = standard.ue_literacy.writing
    standard.standard_number = standard.basic_info.standard_number

    standard.subject_id = standard.subjects.map(el => el.subject_id);

    return standard
}

function starStandard(standard_number, element) {
    standard = standards.find(s => s.id == standard_number)
    standard = convertStandard(standard)

    console.log(`Adding ${standard_number}`);
    if (starred.find(s => s.standard_number === standard_number)) { // already starred
        index = starred.findIndex(s => s.standard_number == standard_number); // get index
        element.innerHTML = starOutline; // replace with outline
        starred.splice(index, 1); // remove from array
    } else {
        console.log(`Checking what subject ${standard_number} is in`)
        s_id = subject_groups.find(sub => {sub.standard_numbers.includes(standard_number)}).subject_id
        standard.subject_id = s_id
        standard.subject_name = standard.subjects.find(sub => sub.subject_id == s_id).display_name
        element.innerHTML = starFull; // fill star
        starred.push(standard); // add this to the starred list
    }
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displayStandards();
}

function unstarStandard(standard_number, element) { // for removing the starred standard
    console.log(`Removing ${standard_number}`);
    index = starred.findIndex(s => s.standard_number == standard_number); // get index
    starred.splice(index, 1); // remove from array
    window.localStorage.setItem('starred', JSON.stringify(starred)); // update browser storage
    displayStandards();
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

function decode64(str) {
    var out = 0;
    let charstring = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; 
    for (i = 0; i < str.length; i++) { // iterate over 64 bit encoded string
        out = charstring.indexOf(str[i]) + (out * 64); // add to the total
    }
    return out;
}

$(document).ready(function() {
    getInfo().then(displayStandards);
    updateHeader();
    getStarred();
});