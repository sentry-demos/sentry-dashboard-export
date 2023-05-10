const delete_properties = ["createdBy", "dateCreated", "id", "dashboardId", "widgetId"]

window.onload = async () => {
    const form = document.getElementById('transferForm');
    const title = document.getElementById('dashboard_title');

    const dash = await getCurrentOrg()
    console.log(dash);
    console.log(dash["base_url"])
    const from_dashboard = `https://${dash["base_url"]}/api/0/organizations/${dash["org_slug"]}/dashboards/${dash["dashboard_id"]}/`
    const dashboard = await get_dashboard(from_dashboard);
    title.innerHTML = dashboard["title"];

    form.onsubmit = async (e) => {
        e.preventDefault();
        let payload = await normalize_data(dashboard);
        payload["projects"] = []
        console.log(payload)
        
        let org_slug = document.getElementById("org_slug")
        if (org_slug.value !== "") {
            console.log('submitting');
            let options = {
                contentScriptQuery: "submitDashboard",
                org_slug: org_slug.value,
                payload: payload
            }
            chrome.runtime.sendMessage(options, response => {
                console.log("response");
                console.log(response);
            })
            /*let to_dashboard = `https://${org_slug.value}.sentry.io/api/0/organizations/${org_slug.value}/dashboards/`;
            let response = await fetch(to_dashboard, { 
                mode: "cors",
                cache: "no-cache",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                method: "POST", 
                body: JSON.stringify(payload) 
            })
            console.log(response.json());*/
        }

        
    }

    async function getCurrentOrg(){
        return new Promise((resolve, reject) => {
            const regex = {
                "base_url" : /(?<=\/\/)(.*?)(?=\/)/,
                "dashboard_id" : /(?<=dashboard\/)(.*?)(?=\/)/,
                "org_slug": /(?<=\/\/)(.*?)(?=.sentry.io\/)/
                
            }
            let response = {}
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var activeTab = tabs[0];
                url = activeTab.url;
                console.log(url)
                for (attr in regex) {
                    let match = url.match(regex[attr]);
                    if (match.length) {
                        response[attr] = match[0]
                    }
                }
    
                resolve(response);
            });
        }) 
        
    }

    async function get_dashboard(url) {
        let response = await fetch(url);
        let jsonData = await response.json();
        return jsonData;
    }

    function normalize_data(source) {
        let payload = {}
        let last_data_attr = null;
        for(data in source) {
            if (Array.isArray(source[data]) && source[data].length !== 0) {
                for(attr in source[data]) {
                    if (typeof source[data] == "undefined") {
                        continue;
                    }
                    if (!payload.hasOwnProperty(data)) {
                        payload[data] = []
                    }

                    if (typeof source[data][attr] !== "string") {
                        if (last_data_attr == null) {
                            last_data_attr = data
                        }
                        payload[last_data_attr].push(normalize_data(source[data][attr]))
                        data = last_data_attr;
                        last_data_attr = null;
                    } else {
                        payload[data].push(source[data][attr])
                    }
                }
            } else {
                if (!delete_properties.includes(data)) {
                    if (data == "limit" && source[data] == null) {
                        payload[data] = 5
                    } else {
                        payload[data] = source[data]
                    }
                }
            }
        }

        return payload
    }
}