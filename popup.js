document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
  document.getElementById("login").addEventListener("click", handleSignInClick);
  document.getElementById("logout").addEventListener("click", handleSignOutClick);
  document
    .getElementById("calculateForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isShowTable = await handleCalculateClick();

      if (isShowTable) {
        showTab("textInput");
        setActiveTab("textTab");
      }
    });

  document.getElementById("textTab").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await handleCalculateClick();

    showTab("textInput");
    setActiveTab("textTab");
  });
  document.getElementById("listTab").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await handleCalculateClick();

    showTab("listOutput");
    setActiveTab("listTab");
  });
  const yearSelector = document.getElementById("yearSelector");
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelector.appendChild(option);
  }
  yearSelector.value = currentYear;
});

let accessToken = null;

function setActiveTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");
}

function showTab(tabId) {
  const tabContents = document.querySelectorAll(".tabContent");
  tabContents.forEach((content) => {
    content.style.display = "none";
  });

  document.getElementById(tabId).style.display = "block";

  if (tabId === "textInput") {
    // document.getElementById('selectedTimeRange').innerText = 'Selected Time Range';
    document.getElementById("resultBlock").style.display = "none";
  } else if (tabId === "listOutput") {
    document.getElementById("resultBlock").style.display = "block";
    document.getElementById("selectedTimeRange").innerText = "";
  }
}

async function checkAuthentication() {
  chrome.identity.getAuthToken({ interactive: false }, function (token) {
      if (token) {
          accessToken = token;
          document.getElementById("login").style.display = "none";
          document.getElementById("calculateForm").style.display = "block";
          document.getElementById("logout").style.display = "block";
      } else {
          document.getElementById("login").style.display = "block";
          document.getElementById("calculateForm").style.display = "none";
          document.getElementById("logout").style.display = "none";
          var formElements = document
              .getElementById("calculateForm")
              .getElementsByTagName("input");
          for (var i = 0; i < formElements.length; i++) {
              formElements[i].disabled = true;
          }
          document.getElementById("button_calculate").disabled = true;
          document.getElementById("button_calculate").style.opacity = "0.5";
          document.getElementById("tabs").style.display = "none";
      }
  });
}

// updated to async function and statements
async function handleSignInClick(event) {
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    if (!token) {
      console.error("No token received");
      return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("logout").style.display = "block";
    document.getElementById("calculateForm").style.display = "block";
    console.log("Token:", token);
  } catch (error) {
    console.error("Error during authentication:", error);
  }
}

async function handleSignOutClick(event) {
  try {
      await new Promise((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: false }, async function (currentToken) {
              if (!chrome.runtime.lastError && currentToken) {
                  // Revoke token with Google's OAuth 2.0 endpoint
                  const revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + currentToken;
                  const xhr = new XMLHttpRequest();
                  xhr.open('GET', revokeUrl);
                  xhr.onload = function () {
                      if (xhr.status === 200) {
                          // Remove token cached by Chrome
                          chrome.identity.removeCachedAuthToken({ token: currentToken }, function () {
                              if (chrome.runtime.lastError) {
                                  reject(chrome.runtime.lastError);
                              } else {
                                  resolve();
                              }
                          });
                      } else {
                          reject('Failed to revoke token');
                      }
                  };
                  xhr.send();
              } else {
                  resolve();
              }
          });
      });

      document.getElementById("login").style.display = "block";
      document.getElementById("calculateForm").style.display = "none";
      document.getElementById("logout").style.display = "none";
      console.log("Logged out successfully");
  } catch (error) {
      console.error("Error during logout:", error);
  }
}


async function handleCalculateClick() {
  return new Promise(async (res, rej) => {
    resetInputStyles();

    const fromDate = document.getElementById("from").value;
    let fromTime = document.getElementById("from_time").value;
    const toDate = document.getElementById("to").value;
    let toTime = document.getElementById("to_time").value;
    const fromTimeFormate = document.getElementById("time_from_formate").value;
    const toTimeFormate = document.getElementById("time_to_formate").value;

    // Convert from 12-hour to 24-hour format if needed
    if (fromTimeFormate === "PM") {
      const fromTimeParts = fromTime.split(":");
      let hours = parseInt(fromTimeParts[0], 10);
      const minutes = parseInt(fromTimeParts[1], 10);
      hours = hours === 12 ? 12 : hours + 12; // Handle special case for 12 PM
      fromTime =
        hours.toString().padStart(2, "0") +
        ":" +
        minutes.toString().padStart(2, "0");
    }

    if (toTimeFormate === "PM") {
      const toTimeParts = toTime.split(":");
      let hours = parseInt(toTimeParts[0], 10);
      const minutes = parseInt(toTimeParts[1], 10);
      hours = hours === 12 ? 12 : hours + 12;
      toTime =
        hours.toString().padStart(2, "0") +
        ":" +
        minutes.toString().padStart(2, "0");
    }

    console.log("fromDate:", fromDate);
    console.log("fromTime:", fromTime);
    console.log("toDate:", toDate);
    console.log("toTime:", toTime);

    if (
      fromDate.trim() === "" ||
      fromTime.trim() === "" ||
      toDate.trim() === "" ||
      toTime.trim() === ""
    ) {
      console.error('Please select both "from" and "to" dates and times');

      const inputs = document.querySelectorAll(
        ".custom-date-picker input, .custom-time-input input"
      );
      inputs.forEach((input) => {
        input.style.borderColor = "red";
      });

      const iconDateFrom = document.getElementById("input-date-from");
      const iconDateTo = document.getElementById("input-date-to");
      const iconTimeFrom = document.getElementById("input-time-from");
      const iconTimeTo = document.getElementById("input-time-to");

      iconDateFrom.src = "./asssets/icon-error.png";
      iconDateFrom.alt = "error";
      iconDateTo.src = "./asssets/icon-error.png";
      iconDateTo.alt = "error";
      iconTimeFrom.src = "./asssets/icon-error.png";
      iconTimeFrom.alt = "error";
      iconTimeTo.src = "./asssets/icon-error.png";
      iconTimeTo.alt = "error";

      document.querySelector(".blockContent").style.display = "none";

      return res(true);
    }

    if (!isValidTime(fromTime) || !isValidTime(toTime)) {
      console.error("Invalid time format");
      return res(false);
    }

    const fromDateTimeString = `${fromDate} ${fromTime}:00`;
    const toDateTimeString = `${toDate} ${toTime}:00`;
    const fromDateTime = new Date(fromDateTimeString);
    const toDateTime = new Date(toDateTimeString);

    if (isNaN(fromDateTime.getTime()) || isNaN(toDateTime.getTime())) {
      console.error("Invalid date or time values");
      return res(false);
    }

    try {
      const events = await fetchCalendarEvents(fromDateTime, toDateTime);
      let { list, text } = analyzeAvailability(
        events,
        fromDateTime,
        toDateTime
      );

      if (!text.length) {
        text = `${fromDateTimeString} to ${toDateTimeString}`;
      }

      document.getElementById("selectedTimeRange").innerText = text;
      document.getElementById("timeDifference").innerText = "";
      document.getElementById("timeDifference").appendChild(list);
      document.getElementById("resultBlock").style.display = "block";
      document.getElementById("tabs").classList.add("showTabs");
      document.getElementById("copyButton").src = "./asssets/icon-copy.png";
      document.getElementById("copyButton").alt = "icon-copy";

      document.querySelector(".blockContent").style.display = "flex";

      res(true);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      rej(error);
    }
  });
}

function resetInputStyles() {
  const inputs = document.querySelectorAll(
    ".custom-date-picker input, .custom-time-input input"
  );
  inputs.forEach((input) => {
    input.style.borderColor = "";
  });

  const iconDateFrom = document.getElementById("input-date-from");
  const iconDateTo = document.getElementById("input-date-to");
  const iconTimeFrom = document.getElementById("input-time-from");
  const iconTimeTo = document.getElementById("input-time-to");

  iconDateFrom.src = "./asssets/icon-input.png";
  iconDateFrom.alt = "calendar";
  iconDateTo.src = "./asssets/icon-input.png";
  iconDateTo.alt = "calendar";
  iconTimeFrom.src = "./asssets/icon-input.png";
  iconTimeFrom.alt = "time";
  iconTimeTo.src = "./asssets/icon-input.png";
  iconTimeTo.alt = "time";
}

function isValidTime(timeString) {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
}

// const fetchCalendarEvents = async (startTime, endTime) => {
//   try {
//     const CALENDAR_ID = await findPrimaryCalendar(accessToken);
//     console.log("Calendar ID:", CALENDAR_ID);

//     const currentYear = new Date().getFullYear();

//     const formattedStartTime = new Date(
//       currentYear, 
//       startTime.getMonth(), 
//       startTime.getDate(), 
//       0, 
//       0, 
//       0, 
//       0
//     ).toISOString();

//     const formattedEndTime = new Date(
//       currentYear, 
//       endTime.getMonth(), 
//       endTime.getDate() + 1, 
//       0, 
//       0, 
//       0, 
//       0
//     ).toISOString();

//     console.log(formattedStartTime, formattedEndTime);
//     const apiUrl = `https://content.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
//       CALENDAR_ID
//     )}/events?timeMin=${formattedStartTime}&timeMax=${formattedEndTime}`;

//     console.log("Fetching events from API:", apiUrl);

//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//       Accept: "application/json",
//     };

//     const response = await fetch(apiUrl, { headers });

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error("Error fetching calendar events:", errorData);
//       throw new Error(
//         `Failed to fetch calendar events. Status: ${response.status}`
//       );
//     }

//     const data = await response.json();
//     const events = data.items || [];

//     console.log("Events:", events);
//     return events;
//   } catch (error) {
//     console.error("Error fetching calendar events:", error);
//     return [];
//   }
// };

const fetchCalendarEvents = async (startTime, endTime) => {
  try {
    const calendarIds = await findCalendarIds(accessToken); // Fetch all calendar IDs
    console.log("Calendar IDs:", calendarIds);

    const currentYear = new Date().getFullYear();

    const formattedStartTime = new Date(
      currentYear, 
      startTime.getMonth(), 
      startTime.getDate(), 
      0, 
      0, 
      0, 
      0
    ).toISOString();

    const formattedEndTime = new Date(
      currentYear, 
      endTime.getMonth(), 
      endTime.getDate() + 1, 
      0, 
      0, 
      0, 
      0
    ).toISOString();

    console.log(formattedStartTime, formattedEndTime);

    const fetchPromises = calendarIds.map(async (calendarId) => {
      const apiUrl = `https://content.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?timeMin=${formattedStartTime}&timeMax=${formattedEndTime}`;

      console.log("Fetching events from API:", apiUrl);

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching calendar events:", errorData);
        throw new Error(
          `Failed to fetch calendar events. Status: ${response.status}`
        );
      }

      const data = await response.json();
      const events = data.items || [];

      const recurringEvents = events.filter(event => event.recurrence);

      for (const event of recurringEvents) {
        const expandedEvents = await expandRecurringEvent(event, startTime, endTime);
        events.push(...expandedEvents);
      }

      console.log("Events:", events);
      return events;
    });

    // Wait for all fetch operations to complete and merge the results
    const allEvents = await Promise.all(fetchPromises);
    const mergedEvents = [].concat(...allEvents);

    console.log("Events:", mergedEvents);
    return mergedEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};


async function findCalendarIds(accessToken) {
  const endpoint =
    "https://www.googleapis.com/calendar/v3/users/me/calendarList";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  try {
    const response = await fetch(endpoint, { headers: headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // return data.items.find(({ primary }) => primary)?.id;
    const calendarIds = data.items.map((item) => item.id);
    return calendarIds;
  } catch (error) {
    console.error("Error fetching calendar list:", error);
  }
}

const expandRecurringEvent = async (event, startTime, endTime) => {
  try {
    const recurrenceRule = event.recurrence[0]; // Assuming only one recurrence rule
    const apiUrl = `https://content.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      event.organizer.email
    )}/events/${event.id}/instances?timeMin=${startTime.toISOString()}&timeMax=${endTime.toISOString()}&timeZone=UTC`;

    console.log("Expanding recurring event:", apiUrl);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error expanding recurring event:", errorData);
      return [];
    }

    const data = await response.json();
    const expandedEvents = data.items || [];

    console.log("Expanded events:", expandedEvents);
    return expandedEvents;
  } catch (error) {
    console.error("Error expanding recurring event:", error);
    return [];
  }
};

// function analyzeAvailability(events, startTime, endTime) {
//   events.sort(
//     (a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime)
//   );
//   const freePeriods = [
//     {
//       start: new Date(startTime),
//       end: new Date(endTime),
//     },
//   ];

//   for (const event of events) {
//     const eventStart = new Date(event.start.dateTime);
//     const eventEnd = new Date(event.end.dateTime);

//     for (let i = 0; i < freePeriods.length; i++) {
//       const freePeriod = freePeriods[i];
//       if (eventStart >= freePeriod.start && eventStart < freePeriod.end) {
//         if (eventStart.getTime() !== freePeriod.start.getTime()) {
//           freePeriods.splice(
//             i,
//             1,
//             {
//               start: freePeriod.start,
//               end: eventStart,
//             },
//             {
//               start: eventEnd,
//               end: freePeriod.end,
//             }
//           );
//         } else {
//           freePeriod.start = eventEnd;
//         }
//       } else if (eventStart <= freePeriod.start && eventEnd >= freePeriod.end) {
//         freePeriods.splice(i, 1);
//         i--;
//       } else if (eventEnd > freePeriod.start && eventEnd <= freePeriod.end) {
//         freePeriod.start = eventEnd;
//       }
//     }
//   }

//   const newDateRanges = splitAndFilterDateRanges(freePeriods);
//   const wrapper = document.createElement("div");
//   wrapper.classList.add("wrapper");
//   const dateFormatOptions = { day: "2-digit", month: "2-digit", hour12: true };
//   const timeFormatOptions = {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   };
//   let currentDate = "";
//   let divWrapper = "";
//   for (const freePeriod of newDateRanges) {
//     const date = freePeriod.start.toLocaleDateString("ua", dateFormatOptions);
//     const startTimeString = freePeriod.start.toLocaleTimeString(
//       "ua",
//       timeFormatOptions
//     );
//     const endTimeString = freePeriod.end.toLocaleTimeString(
//       "ua",
//       timeFormatOptions
//     );

//     const div = document.createElement("div");
//     div.classList.add("flex-content");
//     const dateBlock = document.createElement("div");
//     dateBlock.classList.add("date-block");
//     const timeBlock = document.createElement("div");
//     timeBlock.classList.add("time-block");

//     if (date !== currentDate) {
//       currentDate = date;
//       const span = document.createElement("div");
//       span.innerHTML = date;
//       dateBlock.appendChild(span);
//       divWrapper += `${date}`;
//       divWrapper += ` `;
//     }
//     if (startTimeString !== endTimeString) {
//       const span = document.createElement("div");
//       span.innerHTML = `${startTimeString} – ${endTimeString}`;
//       timeBlock.appendChild(span);
//       divWrapper += `${startTimeString} – ${endTimeString}`;
//       divWrapper += `\n`;
//     }
//     div.appendChild(dateBlock);
//     div.appendChild(timeBlock);
//     wrapper.appendChild(div);
//   }
//   return { list: wrapper, text: divWrapper };
// }

// function analyzeAvailability(events, fromDateTime, toDateTime) {
//   const startTime = new Date(fromDateTime);
//   const endTime = new Date(toDateTime);

//   const freePeriods = [];

//   // Iterate through each day within the date range
//   const currentDate = new Date(startTime);
//   while (currentDate <= endTime) {
//     const startOfDay = new Date(currentDate);
//     startOfDay?.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(currentDate);
//     endOfDay?.setHours(23, 59, 59, 999);

//     // Initialize the free period for the current day
//     const freePeriod = { start: startOfDay, end: endOfDay };

//     // Exclude event durations from free periods for the current day
//     if (Array.isArray(events)) {
//       events.forEach((event) => {
//         const eventStart = new Date(event?.start?.dateTime);
//         const eventEnd = new Date(event?.end?.dateTime);

//         if (eventStart <= freePeriod?.end && eventEnd >= freePeriod?.start) {
//           if (eventStart <= freePeriod?.start && eventEnd >= freePeriod?.end) {
//             // Event overlaps the entire day, remove the free period
//             freePeriod.start = endOfDay;
//             freePeriod.end = endOfDay;
//           } else if (
//             eventStart <= freePeriod?.start &&
//             eventEnd < freePeriod?.end
//           ) {
//             // Event overlaps the start of the day
//             freePeriod.start = eventEnd;
//           } else if (
//             eventStart > freePeriod?.start &&
//             eventEnd >= freePeriod?.end
//           ) {
//             // Event overlaps the end of the day
//             freePeriod.end = eventStart;
//           } else if (
//             eventStart > freePeriod?.start &&
//             eventEnd < freePeriod?.end
//           ) {
//             // Event is within the day, split the free period into two
//             freePeriods.push({ start: freePeriod.start, end: eventStart });
//             freePeriod.start = eventEnd;
//           }
//         }

//         console.log("free periods:", freePeriod);
//       });
//     }

//     // Add the remaining free period for the day
//     freePeriods.push(freePeriod);

//     // Move to the next day
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   const wrapper = document.createElement("div");
//   wrapper.classList.add("wrapper");
//   const dateFormatOptions = { day: "2-digit", month: "2-digit", hour12: true };
//   const timeFormatOptions = {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   };
//   let divWrapper = "";

//   freePeriods.forEach((period) => {
//     const { start, end } = period;
//     const startFormatted = start.toLocaleTimeString("en-US", timeFormatOptions);
//     const endFormatted = end.toLocaleTimeString("en-US", timeFormatOptions);
//     const startDateFormatted = start.toLocaleDateString(
//       "en-US",
//       dateFormatOptions
//     );
//     const endDateFormatted = end.toLocaleDateString("en-US", dateFormatOptions);

//     const div = document.createElement("div");
//     div.classList.add("flex-content");
//     const dateBlock = document.createElement("div");
//     dateBlock.classList.add("date-block");
//     const timeBlock = document.createElement("div");
//     timeBlock.classList.add("time-block");

//     const spanDate = document.createElement("div");
//     spanDate.innerHTML = startDateFormatted;
//     dateBlock.appendChild(spanDate);

//     const spanTime = document.createElement("div");
//     spanTime.innerHTML = `${startFormatted} – ${endFormatted}`;
//     timeBlock.appendChild(spanTime);

//     div.appendChild(dateBlock);
//     div.appendChild(timeBlock);
//     wrapper.appendChild(div);

//     divWrapper += `${startDateFormatted} ${startFormatted} – ${endFormatted} (${endDateFormatted})\n`;
//   });

//   return { list: wrapper, text: divWrapper };
// }


function analyzeAvailability(events, startTime, endTime) {
  events.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
  
  const freePeriods = [{
      start: new Date(startTime),
      end: new Date(endTime)
  }];

  for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
      const event = events[eventIndex];
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      for (let i = 0; i < freePeriods.length; i++) {
          const freePeriod = freePeriods[i];

          if (eventStart >= freePeriod.start && eventStart < freePeriod.end) {
              if (eventStart.getTime() !== freePeriod.start.getTime()) {
                  freePeriods.splice(i, 1, {
                      start: freePeriod.start,
                      end: eventStart
                  }, {
                      start: eventEnd,
                      end: freePeriod.end
                  });
              } else {
                  freePeriod.start = eventEnd;
              }
          } else if (eventStart <= freePeriod.start && eventEnd >= freePeriod.end) {
              freePeriods.splice(i, 1);
              i--;
          } else if (eventEnd > freePeriod.start && eventEnd <= freePeriod.end) {
              freePeriod.start = eventEnd;
          }
      }

      // Check if this is the last event and if it ends on a different date than the free period's end date
      // if (eventIndex === events.length - 1 && eventEnd.toDateString() !== freePeriods[freePeriods.length - 1].end.toDateString()) {
      //     // Divide the free time into two
      //     freePeriods.push({
      //         start: eventEnd,
      //         end: freePeriods[freePeriods.length - 1].end
      //     });
      //     freePeriods[freePeriods.length - 2].end = eventEnd;
      // }
  }

  console.log("freePeriods", freePeriods);
// }




// function analyzeAvailability(events, startTime, endTime) {
//   events.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
//   const freePeriods = [{
//       start: new Date(startTime),
//       end: new Date(endTime)
//   }];


//   for (const event of events) {
//       const eventStart = new Date(event.start.dateTime);
//       const eventEnd = new Date(event.end.dateTime);

//       for (let i = 0; i < freePeriods.length; i++) {
//           const freePeriod = freePeriods[i];
//           if (eventStart >= freePeriod.start && eventStart < freePeriod.end) {
//               if (eventStart.getTime() !== freePeriod.start.getTime()) {
//                   freePeriods.splice(i, 1, {
//                       start: freePeriod.start,
//                       end: eventStart
//                   }, {
//                       start: eventEnd,
//                       end: freePeriod.end
//                   });
//               } else {
//                   freePeriod.start = eventEnd;
//               }
//           } else if (eventStart <= freePeriod.start && eventEnd >= freePeriod.end) {
//               freePeriods.splice(i, 1);
//               i--;
//           } else if (eventEnd > freePeriod.start && eventEnd <= freePeriod.end) {
//               freePeriod.start = eventEnd;
//           }
//           // if (i === freePeriods.length - 1 && eventStart < freePeriod.end) {
//           //     // Update the end time of the last free period to the start time of the event
//           //     freePeriod.end = eventStart;
//           //     // Add a new free period for the remaining time after the event
//           //     freePeriods.push({
//           //         start: eventEnd,
//           //         end: new Date(endTime)
//           //     });
//           // }
//       }
//   }

  const newDateRanges = freePeriods;
  console.log("newDateRanges", newDateRanges);
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper')
  const dateFormatOptions = { day: '2-digit', month: '2-digit', hour12: true };
  const timeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  let currentDate = '';
  let divWrapper = '';
  for (const freePeriod of newDateRanges) {
      const date = freePeriod.start.toLocaleDateString('ua', dateFormatOptions); 
      const endWrapDate = freePeriod.end.toLocaleDateString('ua', dateFormatOptions);   
      const startTimeString = freePeriod.start.toLocaleTimeString('ua', timeFormatOptions);
      const endTimeString = freePeriod.end.toLocaleTimeString('ua', timeFormatOptions);

      console.log("freeper ", freePeriod);
      console.log("start ", startTimeString, "end ", endTimeString);


      const div = document.createElement('div');
      div.classList.add('flex-content')
      const dateBlock = document.createElement('div');
      dateBlock.classList.add('date-block')
      const timeBlock = document.createElement('div');
      timeBlock.classList.add('time-block')

      // if (date !== currentDate) {
      currentDate = date;
      const dtSpan = document.createElement('div');
      dtSpan.innerHTML = `${date} ${startTimeString}`;
      dateBlock.appendChild(dtSpan);
      // divWrapper += `${date}`
      // divWrapper += ` `
      // }
      // if (startTimeString !== endTimeString) {
      const tmSpan = document.createElement('div');
      tmSpan.innerHTML = `${endWrapDate} ${endTimeString}`;
      timeBlock.appendChild(tmSpan);
      divWrapper += `${date} ${startTimeString} – ${endWrapDate} ${endTimeString}`;
      divWrapper += `\n`
      // } else {
      //     const endOfDay = new Date();
      //     endOfDay.setHours(11, 59, 0, 0);
      //     const endOfDayString = endOfDay.toLocaleTimeString('ua', timeFormatOptions);
          
      //     const span = document.createElement('div');
      //     span.innerHTML = `${startTimeString} – ${endWrapDate} ${endOfDayString}`;
      //     timeBlock.appendChild(span);
      //     divWrapper += `${startTimeString} – ${endWrapDate} ${endOfDayString}`;
      //     divWrapper += `\n`
      // }
      div.appendChild(dateBlock);
      div.appendChild(timeBlock);
      wrapper.appendChild(div);
  }
  return { list: wrapper, text: divWrapper };

}



// function splitAndFilterDateRanges(ranges) {
//   let result = [];

//   ranges.forEach(({ start, end }) => {
//     const startDate = new Date(start);
//     const endDate = new Date(end);

//     if (
//       startDate.toISOString().split("T")[0] ===
//       endDate.toISOString().split("T")[0]
//     ) {
//       result.push({ start, end });
//     } else {
//       let endOfStartDay = new Date(startDate);
//       endOfStartDay.setHours(23, 59, 59, 999);

//       let startOfEndDay = new Date(endDate);
//       startOfEndDay.setHours(0, 0, 0, 0);

//       if (startOfEndDay < endDate) {
//         result.push({ start: new Date(startOfEndDay.toISOString()), end });
//       }
//     }
//   });

//   return result;
// }

function formatTime(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hours and ${minutes} minutes`;
}

document.getElementById("privacyLink").addEventListener("click", function () {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("privacyPage").style.display = "block";
});

document.getElementById("backButton").addEventListener("click", function () {
  document.getElementById("privacyPage").style.display = "none";
  document.getElementById("mainPage").style.display = "block";
});

document
  .querySelector("#input-time-from")
  .addEventListener("click", openDropDown);
document
  .querySelector("#input-date-from")
  .addEventListener("click", openDropDown);
document
  .querySelector("#input-time-to")
  .addEventListener("click", openDropDown);
document
  .querySelector("#input-date-to")
  .addEventListener("click", openDropDown);

function openDropDown() {
  this.previousElementSibling.click();
}

const copyButton = document.getElementById("copyButton");
const selectedTimeRange = document.getElementById("selectedTimeRange");

function copyTextToClipboardAndChangeImage(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  copyButton.src = "./asssets/checked.png";
  copyButton.alt = "checked";
}

const selectedRange = document.querySelector(".selectedRange");

copyButton.addEventListener("click", function () {
  const textToCopy = selectedRange.textContent;
  copyTextToClipboardAndChangeImage(textToCopy);
});

selectedTimeRange.addEventListener("click", function () {
  const textToCopy = selectedRange.textContent;
  copyTextToClipboardAndChangeImage(textToCopy);
});
