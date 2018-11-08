
let notifyHeader = null;
let timeOffFormDiv = null;
let notifyFormDiv = null;
let reviewDiv = null;

let contactButtons = null;

// track the last user so we can reset when a new user logs in
let lastUser = 0;

function switchVisibleSections(sectionToShow) {

  // hide all sections of this page
  contactButtons.style.display = "none";
  notifyHeader.style.display = "none";
  reviewDiv.style.display = "none";
  notifyFormDiv.style.display = "none";
  timeOffFormDiv.style.display = "none";

  // display specific section
  switch (sectionToShow) {
    case 'top':
      contactButtons.style.display = "block";
      notifyHeader.style.display = "block"
      break;
    case 'notify':
      notifyFormDiv.style.display = "block";
      break;
    case 'timeoff':
      timeOffFormDiv.style.display = "block";
      break;
    case 'review':
      reviewDiv.style.display = "block";
      break;
    default:
      console.log(`Error: switchVisibleSections, bad param: `, sectionToShow);
  }

}

/* ==================================================
*  onMenuNotify()
*  Initial Menu selection handler, this is where it all begins
*  when user clicks the top menu.
* =================================================== */
function onMenuNotify() {
  changeMenuAndContentArea("nav--notify", gelemContentNotify);

  // if a new user has logged in we want to reset what sections are visible
  // and any lingering content the last user may have typed into a message or
  // time-off request
  if (lastUser != gactiveUserId) {

    // clear lingering content and reset to show the main three buttons
    notifyCancel();
    timeOffCancel();

    lastUser = gactiveUserId;
  }
}

/* ==================================================
*  notifyClick()
*  Clicked button to initiate the Notify form
* =================================================== */
function notifyClick() {
  // console.log("notifyClick");

  // update what sections of page are visible
  switchVisibleSections('notify');

  // set focus on the comment control
  document.forms.notifyForm.elements.notifyComment.focus();
}

/* ==================================================
*  deleteNotication()
*  Clicked delete button for a notification in review list of notifications.
* =================================================== */
function deleteNotification(id) {
  console.log("*** delelete preparing to delete: ", id);
  axios.delete(`notifications/${id}`)
    .then((res) => {
      console.log("");console.log("*** delete res: ", res);console.log("");
      if (!res.data.notification) {
        const err = new Error(`Notification ${id} already deleted`);
        err.status = 500;
        throw err;
      }
      // re-render the review page
      reviewClick();
    })
    .catch((err) => {
      handleError("deleteNotication", err);
    });
}

/* ==================================================
*  reviewClick()
*  Clicked button to initiate the Review page
* =================================================== */
function reviewClick() {
  // console.log("reviewClick");

  // update what sections of page are visible
  switchVisibleSections('review');

  /* ------------------
  *  getDateOnly()
  --------------------- */
  function getDateOnly(_dt) {
    const dt = new Date(_dt); // this allows the dt param to be Date or String
    if (isNaN(dt)) {
      return "?";
    }
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
  }
  // ------------------

  axios.get(`notifications/user/${gactiveUserId}`)
    .then((res) => {
      const elemList = document.getElementById('list-review');
      elemList.innerHTML = "loading...";
      let html = "";

      // get the list of notifcations and sort with more recently added first
      const aNotifications = res.data.notifications;
      aNotifications.sort((a, b) => ((a.created_at < b.created_at) ? 1 : -1));

      html = `
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">del</th>
              <th scope="col">message or time-off</th>
              <th scope="col" class="text-center">added</th>
            </tr>
          </thead>`;
      for (const oNotification of aNotifications) {
        html += `
            <tr>
              <td><a href="#" onclick=deleteNotification(${oNotification.id})><i class="fas fa-trash-alt"></i></a>`;
        if (oNotification.start_date) {
          html += `
              <td>` + getDateOnly(`${oNotification.start_date}`) + ` - ` + getDateOnly(`${oNotification.end_date}`) + `<br>
                   ${oNotification.comment}</td>`;
        } else {
          html += `
              <td>${oNotification.comment}</td>`;
        }
        html += `
              <td class="text-center">` + getDateOnly(`${oNotification.created_at}`) + `</td>
            <tr>`;
      }
      html += `
          </table>`;

      if (!aNotifications.length) {
        html += "<h5 class='pl-2'>There are no notifications to list</h5>";
      }
      // console.log("---- html: ", html);
      elemList.innerHTML = html;
    })
    .catch((error) => {
      handleError("renderRecentRequests", error);
    });
}

/* ==================================================
*  notifyPost()
*  Clicked Notify Form submit
* =================================================== */
function notifyPost() {
  // console.log("notify post");

  let comment = document.forms.notifyForm.elements.notifyComment.value;
  comment = comment.trim();

  // // if the user entered a comment, add it to the notificuations table
  if (comment.length) {
    const oComment = {
      user_id: gactiveUserId,
      comment,
    };
    // console.log("Send object to AXIOS: ", oComment);
    axios.post('notifications/', oComment)
      .then((data) => {
        console.log('AXIOS data: ', data);
        if (!data.data.notification) {
          const err = new Error("axios post failed to return the posted record");
          err.status = 500;
          throw err;
        }
        // clear form data, AXIOS call was successful
        document.forms.notifyForm.elements.notifyComment.value = "";
      })
      .catch((error) => {
        handleError("notifyPost", error);
      });
  }

  // update what sections of page are visible
  switchVisibleSections('top');

  return false; // prevent form from actually submitting
}

/* ==================================================
*  notifyCancel()
*  Clicked cancel on Notify Form
* =================================================== */
function notifyCancel() {

  // clear form data
  document.forms.notifyForm.elements.notifyComment.value = "";

  // update what sections of page are visible
  switchVisibleSections('top');
}

/* ==================================================
*  reviewDone()
*  Clicked done on Review page
* =================================================== */
function reviewDone() {
  // update what sections of page are visible
  switchVisibleSections('top');
}

/* ==================================================
*  timeOffCancel()
*  Clicked cancel in Time-off form
* =================================================== */
function timeOffCancel() {

  // clear form data
  document.getElementById('vacation-start-date-input').value = "";
  document.getElementById('vacation-end-date-input').value = "";
  document.getElementById('time-off-text-area').value = "";

  // update what sections of page are visible
  switchVisibleSections('top');
}


/* ==================================================
*  timeOffClick()
*  Clicked button to initiate the Time-off Form
* =================================================== */
function timeOffClick() {

  // update what sections of page are visible
  switchVisibleSections('timeoff')


  // render the table to display recent time-off requests
  // renderRecentRequests();

  // set focus on the start date control
  document.getElementById('vacation-start-date-input').focus();
}

/* ==================================================
*  timeOffPost()
*  Clicked submit button on Time-Off Form
* =================================================== */
function timeOffPost() {
  console.log("notify post");

  const start_date = document.getElementById('vacation-start-date-input').value;
  const end_date = document.getElementById('vacation-end-date-input').value;
  let comment = document.getElementById('time-off-text-area').value;
  comment = comment.trim();

  const oRequest = {
    user_id: gactiveUserId,
    start_date,
    end_date,
    comment,
  };
  // console.log("Send object to AXIOS: ", oComment);
  axios.post('notifications/', oRequest)
    .then((data) => {
      console.log('AXIOS data: ', data);
      if (!data.data.notification) {
        const err = new Error("axios post failed to return the posted record");
        err.status = 500;
        throw err;
      }
      // clear form data, AXIOS call was successful
      document.getElementById('vacation-start-date-input').value = "";
      document.getElementById('vacation-end-date-input').value = "";
      document.getElementById('time-off-text-area').value = "";
    })
    .catch((error) => {
      handleError("timeOffPost", error)
    });

  // update what sections of page are visible
  timeOffFormDiv.style.display = "none";
  contactButtons.style.display = "";
  notifyHeader.style.display = ""

  return false; // prevent actual form submission
}

/* ==================================================
*  DOM loaded, setup and set button event listener
* =================================================== */
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded for menu-notify.js");

  notifyHeader = document.getElementById('notifyHeader')

  // div containing the two buttons that choose which form to display
  contactButtons = document.getElementById('contactButtons');
  document.getElementById('notify-button').onclick = notifyClick;
  document.getElementById('time-off-button').onclick = timeOffClick;
  document.getElementById('review-button').onclick = reviewClick;

  // notify form
  notifyFormDiv = document.getElementById('notifyFormDiv');
  document.getElementById("notify-cancel-button").onclick = notifyCancel;
  document.forms.notifyForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    notifyPost();
  });

  // time off form
  timeOffFormDiv = document.getElementById('timeOffFormDiv');
  document.getElementById("time-off-cancel-button").onclick = timeOffCancel;
  document.forms.timeOffForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    timeOffPost();
  });

  // review list of notifications and time-off
  reviewDiv = document.getElementById('reviewDiv');
  document.getElementById("review-return-button").onclick = reviewDone;
});
