// define the globals
standards = []


function getListFromURL() {
    var urlParams = new URLSearchParams(window.location.search); // get url parameters
    var standardNumbers = urlParams.get('n')

    if (standardNumbers == null) {
        window.location = "/"; // if there's no n parameter in the url, redirect to home, which is a safe bet
    }

    standardNumbers = standardNumbers.match(/.{3}/g).map(decode64) // regex magic to split the string into sections of 3, then we decode them all
    return standardNumbers
}

function getInfo() {
    var standardNumbers = getListFromURL()
    console.log(`Getting standards `)
    var standardstring = standardNumbers.join(".") // as in the backend, these have to be full-stop separated
    console.log(standardstring)
    let promise = new Promise((resolve, reject) => {
        $.get("/api/standards?number=" + standardstring, function (data) { // send the get request to the API
            if (data.success) {
                console.log("Successfully gathered " + data.standards.length + " subjects");
                standards = data.standards
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
    // for totals footer
    total_credits = 0
    total_reading = 0
    total_writing = 0
    total_numeracy = 0
    standards.forEach(standard => {
        standard.id = standard.basic_info.standard_number // to suit the search-configured row generation function (i reuse it a lot)
        total_credits += standard.basic_info.credits;
        total_reading += standard.ue_literacy.reading ? standard.basic_info.credits : 0; // either add the number of credits or nothing 
        total_writing += standard.ue_literacy.writing ? standard.basic_info.credits : 0; // depending on the writing/reading credits
        total_numeracy += standard.ncea_litnum.numeracy ? standard.basic_info.credits : 0;

        outhtml += generateStandardRow(standard);
    });
    outhtml += `</tbody>`;
    // add row of totals to footer
    outhtml += `<tfoot>
                    <tr class='border-bottom-0'>
                        <th colspan=4 class='border-start-0'>
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
    $("#sharedList").html(outhtml);

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
    stretchedlinkstr = `<a href='/standard/?num=` + standard.id + `' class='stretched-link link'></a>`;

    outhtml += "<tr class='clickable " + i_e_class + "'>" // initialise row

    // add <th> (header) styled standard number with link to the standard page
    outhtml += `    <th scope='row' style='position: relative;'>
                        ${stretchedlinkstr}
                        <span class='float-end'>` + standard.id + `</span>
                    </th>`

    // add all the other information in <td> styled boxes
    outhtml += `    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.basic_info.title + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + ((parseInt(standard.id) < 90000) ? "Unit" : "Achievement") + `
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.basic_info.level + `
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + standard.basic_info.credits + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        <span class='float-start'>` + (standard.ue_literacy.reading ? "R" : " ") + `</span>
                        <span class='float-end'>` + (standard.ue_literacy.writing ? "W" : " ") + `</span>
                    </td>
                    <td class='text-center' style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + (standard.ncea_litnum.numeracy ? "Y" : " ") + `
                    </td>
                    <td style='position: relative;'>
                        ${stretchedlinkstr}
                        ` + (standard.basic_info.internal ? `Internal` : `External`) + `
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
});