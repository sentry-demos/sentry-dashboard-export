const delete_properties = ["createdBy", "dateCreated", "id", "dashboardId", "widgetId"]

window.onload = async () => {
    
    const form = document.getElementById('transferForm');
   
    form.onsubmit = async (e) => {
      e.preventDefault()
      const dash = await getCurrentOrg()
      const from_dashboard = `https://${dash["base_url"]}/api/0/organizations/${dash["org_slug"]}/dashboards/${dash["dashboard_id"]}/`
      const dashboard = await get_dashboard(from_dashboard);
      downloadObjectAsJson(normalize_data(dashboard), 'dashboard')
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
        if (source.hasOwnProperty("projects")) {
            source["projects"] = []
        }

        let payload = {}
        let last_data_attr = null;
        for(data in source) {
            if (Array.isArray(source[data]) && source[data].length !== 0) {
                for(attr in source[data]) {
                    if (typeof source[data] === "undefined") {
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

    function downloadObjectAsJson(exportObj, exportName) {
        const dataStr =
          'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', exportName + '.json');
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
}