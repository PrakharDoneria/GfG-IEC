const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaOrCPw5vjgvgy8R6xYwPCK7PCu7WnTW14tpFC0TGiz4fTK_Wg-DFWeo3qhBObXIQRDY1wC5Y2Whsq/pub?output=csv";

const tableContainer = document.getElementById("tableContainer");
const tableHeader = document.getElementById("tableHeader");
const tableBody = document.getElementById("tableBody");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const filterSection = document.getElementById("filterSection");

let rawData = [];
let filteredData = [];
let headers = [];

const FILTER_CONFIG = [
  { label: "Year", index: 5 },
  { label: "Branch", index: 7 },
  { label: "Section", index: 6 },
  { label: "Mentor", index: 9 },
  { label: "College", index: 10 }
];

const activeFilters = {
  Year: new Set(),
  Branch: new Set(),
  Section: new Set(),
  Mentor: new Set(),
  College: new Set()
};

/**
 * Very basic CSV parser that handles quoted values containing commas
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const result = [];
    let curValue = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(curValue.trim());
        curValue = "";
      } else {
        curValue += char;
      }
    }
    result.push(curValue.trim());
    return result;
  });
}

async function fetchData() {
  loadingState.classList.remove("hidden");
  tableContainer.classList.add("hidden");
  errorState.classList.add("hidden");
  filterSection.classList.add("hidden");
  exportBtn.classList.add("hidden");

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const csvContent = await response.text();
    const data = parseCSV(csvContent);
    
    if (data.length <= 1) throw new Error("No data found");
    
    headers = data[0];
    rawData = data.slice(1).filter(row => row.length > 1);
    
    initFilters();
    applyFilters();
    
    loadingState.classList.add("hidden");
    tableContainer.classList.remove("hidden");
    filterSection.classList.remove("hidden");
    exportBtn.classList.remove("hidden");
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
  }
}

function initFilters() {
  FILTER_CONFIG.forEach(config => {
    const container = document.getElementById(`filter-${config.label}`);
    container.innerHTML = "";
    
    const uniqueValues = [...new Set(rawData.map(row => row[config.index]))]
      .filter(val => val && val.trim() !== "")
      .sort();
    
    uniqueValues.forEach(val => {
      const label = document.createElement("label");
      label.className = "filter-option";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = val;
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          activeFilters[config.label].add(val);
        } else {
          activeFilters[config.label].delete(val);
        }
        applyFilters();
      });
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(val));
      container.appendChild(label);
    });
  });
}

function applyFilters() {
  filteredData = rawData.filter(row => {
    return FILTER_CONFIG.every(config => {
      const selectedSet = activeFilters[config.label];
      if (selectedSet.size === 0) return true;
      return selectedSet.has(row[config.index]);
    });
  });
  
  renderTable();
}

function renderTable() {
  // Clear existing content
  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";
  
  // Render Headers
  headers.forEach(headerText => {
    const th = document.createElement("th");
    th.textContent = headerText;
    tableHeader.appendChild(th);
  });
  
  // Render Rows
  filteredData.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cellText => {
      const td = document.createElement("td");
      td.textContent = cellText;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  if (filteredData.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = headers.length;
    td.style.textAlign = "center";
    td.style.padding = "40px";
    td.textContent = "No records match the selected filters.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }
}

function exportToCSV() {
  if (filteredData.length === 0) {
    alert("No data to export");
    return;
  }
  
  const csvRows = [headers, ...filteredData].map(row => {
    return row.map(cell => {
      const escaped = ("" + cell).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(",");
  });
  
  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_filtered_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

refreshBtn.addEventListener("click", fetchData);
exportBtn.addEventListener("click", exportToCSV);

// Initial fetch
fetchData();
