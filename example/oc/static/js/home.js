document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchQuery");
  const categorySelect = searchForm.querySelector('select[name="category"]');

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // prevent page reload

    const category = categorySelect.value;
    const query = searchInput.value.trim();

    if (!query) {
      alert("Please enter a search query.");
      return;
    }

    
   
    if (category === "document" || category ==="citation") {
      await openLucinda(query);
    } else {
      // Otherwise, go to Lucinda search mode for authors/venues/citations
      const lucindaUrl = `http://127.0.0.1:5500/example/oc/html_template/browser.html?category=${category}&query=${query}`;
      window.location.href = lucindaUrl;
    }
  });
});

async function idToOmid(identifier) {
  const endpoint = "https://sparql.opencitations.net/meta";

  // Detect type and clean the value
  let scheme, cleanId;

  if (/^doi:|^10\.\d{4,9}\//i.test(identifier)) {
    scheme = "doi";
    cleanId = identifier.replace(/^doi:/i, "");
  } else if (/^pmid:/i.test(identifier)) {
    scheme = "pmid";
    cleanId = identifier.replace(/^pmid:/i, "");
  } else if (/^openalex:/i.test(identifier)) {
    scheme = "openalex";
    cleanId = identifier.replace(/^openalex:/i, "");
  } else {
    throw new Error("Unknown identifier type: " + identifier);
  }

  const query = `
    PREFIX datacite: <http://purl.org/spar/datacite/>
    PREFIX literal: <http://www.essepuntato.it/2010/06/literalreification/>
    SELECT ?omid WHERE {
      ?omid datacite:hasIdentifier ?identifier .
      ?identifier datacite:usesIdentifierScheme datacite:${scheme} ;
                  literal:hasLiteralValue "${cleanId}" .
    } LIMIT 1
  `;

  console.log("SPARQL query to find OMID:\n", query);

  const url = endpoint + "?query=" + encodeURIComponent(query);
  console.log("SPARQL endpoint URL:", url);

  const response = await fetch(url, {
    headers: { "Accept": "application/sparql-results+json" }
  });

  console.log("Response status:", response.status);

  const text = await response.text();
  console.log("Raw response:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error(" Failed to parse JSON:", err);
    throw new Error("The endpoint did not return valid JSON.");
  }

  if (!data.results || data.results.bindings.length === 0) {
    throw new Error(`No OMID found for ${identifier}`);
  }

  return data.results.bindings[0].omid.value;
}

/* Existing function definitions
async function doiToOmid(identifier) {
  const endpoint = "https://sparql.opencitations.net/meta";
  const cleanId = identifier.replace(/^doi:/i, "");

  const query = `
    PREFIX datacite: <http://purl.org/spar/datacite/>
    PREFIX literal: <http://www.essepuntato.it/2010/06/literalreification/>
    SELECT ?omid WHERE {
      ?omid datacite:hasIdentifier ?identifier .
      ?identifier datacite:usesIdentifierScheme datacite:doi ;
                  literal:hasLiteralValue "${cleanId}" .
    } LIMIT 1
  `;

  console.log("SPARQL query to find OMID:\n", query);
  const url = endpoint + "?query=" + encodeURIComponent(query);

  console.log("SPARQL endpoint URL:", url);
  const response = await fetch(url, {
    headers: { "Accept": "application/sparql-results+json" }
  });

  console.log("Response status:", response.status);
  const data = await response.json();

  if (data.results.bindings.length === 0) {
    throw new Error("No OMID found for DOI " + cleanId);
  }

  return data.results.bindings[0].omid.value;
}
*/

async function openLucinda(identifier) {
  try {
    
    let omid;
    // Regex patterns for different identifier types
    const doiRegex = /^(doi:)?10\.\d{4,9}\/[^\s]+$/i;
    // Matches: doi:10.7717/peerj-cs.421, 10.1038/nature12373, etc.

    // PMID: Just digits, can be 1-8 digits typically
    const pmidRegex = /^pmid:\d{1,8}$/i;
    // Matches: pmid:33817056, pmid:12345, etc.

    // OpenAlex: Always starts with W followed by 10 digits
    const openalexRegex = /^openalex:W\d{10}$/i;

    console.log("Input identifier:", identifier);
    console.log("DOI match:", doiRegex.test(identifier));
    console.log("PMID match:", pmidRegex.test(identifier));
    console.log("OpenAlex match:", openalexRegex.test(identifier));
   

    // Check if it's a DOI, PMID, or OpenAlex identifier
    if (doiRegex.test(identifier) || pmidRegex.test(identifier) || openalexRegex.test(identifier)) {
      // Use the unified idToOmid function for all supported identifiers
      omid = await idToOmid(identifier);
    } else {
      // Assume it's already an OMID
      omid = identifier;
    }

  
    const omidId = omid.replace("https://w3id.org/oc/meta/", "");

    const lucindaUrl = `http://127.0.0.1:5500/example/oc/html_template/browser.html?value=${omidId}`;
    window.location.href = lucindaUrl;

  } catch (err) {
    console.error("Error:", err.message);
    alert("Error: " + err.message);
  }
}
