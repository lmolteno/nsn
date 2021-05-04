
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

}

function displayStarred() {
    if (starred.length == 0) {
        $("#starredlist").html(`<p class='text-muted mb-0'>Hit the ${starOutline} icon on a standard to add it here</p>`);
        $("#starredlist svg").addClass("mb-1"); // move the star up a bit, inline with the text
        $("#sharebutton").addClass("disabled") // disable the share button
    } else {
        $("#sharebutton").removeClass("disabled") // re-enable the share button
        sharelink = '/share/?n='
        outhtml = ""
        // starred is a list of standards, we want to organise by subject then level
        // this is a minimum spanning tree of the tree of:
        //        subject1 subject2
        //            |       |
        //          level   level
        //             \     / 
        //            standard
        // put this in the future, for now we will just have it in the table
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
                    <tbody>`;
        // for totals footer
        total_credits = 0
        total_reading = 0
        total_writing = 0
        total_numeracy = 0
        starred.sort((a, b) => (a.standard_number > b.standard_number) - (a.standard_number < b.standard_number)).forEach(standard => {
            standard.id = standard.standard_number // to suit the search-configured row generation function
            total_credits += standard.credits;
            total_reading += standard.reading ? standard.credits : 0; // either add the number of credits or nothing 
            total_writing += standard.writing ? standard.credits : 0; // depending on the writing/reading credits
            total_numeracy += standard.numeracy ? standard.credits : 0;

            outhtml += generateStandardRow(standard);

            // add to shared link
            sharelink += encode64(standard.standard_number)
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
        $("#starredlist").html(outhtml);

        $("#sharebutton").attr("href", sharelink)
    }
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