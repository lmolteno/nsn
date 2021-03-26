subjects = [];
starred = [];

const starOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
  <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.523-3.356c.329-.314.158-.888-.283-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767l-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288l1.847-3.658 1.846 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.564.564 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
</svg>`;
const starFull = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
</svg>`;    

function getSubjects(then=function(){a=1}) { // update the local list of subjects
    $.get("/api/subjects", function(data) {
        if (data.success) {
            console.log("Successfully gathered " + data['subjects'].length.toString() + " subjects");
            subjects = data['subjects'];
            then();
        } else {
            alert("Failure to get subjects. Try reloading. If the problem persists, email linus@molteno.net");
        }
    });
}

function displaySubjects() {
    console.log("Displaying " + subjects.length.toString() + " subjects"); 
    outhtml = ""
    subjects.forEach(subject => {
        outhtml += "<li class='py-1'><a class='link text-decoration-none' href=/subject?id=";
        outhtml += subject.subject_id.toString();
        outhtml += ">";
        outhtml += subject.name;
        outhtml += "</a><a type='button' onClick='starSubject("
        outhtml += subject.subject_id.toString();
        outhtml += ")' class='btn float-end btn-sm p-0 pe-1'>";
        outhtml += starOutline + "</a></li>";
    });
    console.log(outhtml);
    $("#subjectlist").html(outhtml);
}
/*
function starSubject() {
    
}*/

$(document).ready(function() {
    getSubjects(then=displaySubjects); // for async requests, we have to do "thens", like promises
});
