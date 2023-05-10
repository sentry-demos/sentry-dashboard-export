chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    let to_dashboard = `https://${request.org_slug}.sentry.io/api/0/organizations/${request.org_slug}/dashboards/`;
    let response = await fetch(to_dashboard, { 
        mode: "cors",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow",
        method: "POST", 
        body: JSON.stringify(request.payload) 
    })

    sendResponse(response)
})