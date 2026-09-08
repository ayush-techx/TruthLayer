/**
 * Background Service Worker
 * 
 * In Manifest V3, content scripts are bound by the CORS/CSP of the host webpage.
 * To reliably bypass strict CSPs (like those on news sites), we proxy our API
 * requests through this background script, which operates with extension permissions.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_API') {
    const { url, options } = request

    fetch(url, options)
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `HTTP ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        sendResponse({ success: true, data })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })

    // Return true to indicate we will send a response asynchronously
    return true
  }
})
