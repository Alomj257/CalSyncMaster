document.addEventListener("DOMContentLoaded", function () {
    // Add event listener to the login button
    document.getElementById('login').addEventListener('click', handleSignInClick);

    // Add event listener to the logout button
    document.getElementById('logout').addEventListener('click', logoutUser);

    // Check if the user is already logged in
    checkLoggedInStatus();
});

function handleSignInClick(event) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }
        // Hide login button and show relevant content
        document.querySelector('.login').style.display = 'none';
        document.getElementById('calculateForm').style.display = 'block';
        // Display logout button
        document.getElementById('loggedInOptions').style.display = 'block';
        console.log('Token:', token);
    });
}

// function checkLoggedInStatus() {
//     // Implement your logic to check if the user is already logged in
//     // For example, you can check if the user has a valid session or token
//     const isLoggedIn = true; // Assuming the user is already logged in
//     if (isLoggedIn) {
//         document.querySelector('.login').style.display = 'none';
//         document.getElementById('calculateForm').style.display = 'block';
//         document.getElementById('loggedInOptions').style.display = 'block';
//     } else {
//         // If the user is not logged in, display the login button
//         document.querySelector('.login').style.display = 'block';
//         document.getElementById('calculateForm').style.display = 'none';
//         document.getElementById('loggedInOptions').style.display = 'none';
//     }
// }

// Backend logout functionality
// Function to handle logout
function logoutUser() {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
        // Check if token is available
        console.log('Token:', token);

        if (token) {
            // Revoke the token
            chrome.identity.removeCachedAuthToken({ 'token': token }, function() {
                // Token revoked successfully
                console.log('Token revoked');
                // Perform any additional logout tasks (clear local data, etc.)
                // Redirect to a login page if applicable
            });
        } else {
            // No token available (user is not logged in)
            console.log('User is not logged in');
        }
    });
}

// Add event listener to the logout button
// document.getElementById('logout').addEventListener('click', logoutUser);
