document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); 
    const query = document.getElementById("searchQuery").value.trim();
    if (query) {
    const baseUrl = "http://127.0.0.1:5500/example/oc/html_template/browser.html";
    // redirect with the value parameter
    window.location.href = `${baseUrl}?value=${query}`;
    }
});