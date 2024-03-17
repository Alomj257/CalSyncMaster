chrome.runtime.onInstalled.addListener(function () {
    chrome.action.onClicked.addListener(function (tab) {
        chrome.action.setPopup({ popup: 'popup.html' });
    });
});

function getAuthToken(callback) {
    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            callback(chrome.runtime.lastError);
        } else {
            callback(null, token);
        }
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "getAuthToken") {
        getAuthToken(function (error, token) {
            if (error) {
                sendResponse({ error: error });
            } else {
                sendResponse({ token: token });
            }
        });
        return true;
    }
});
