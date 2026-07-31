lucide.createIcons();
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS8kDEmiSKQh0KaxaPGWumMthekZPs6j8wItLKfH1v12PCrGWhHgakoCzm28crM9AjaQR5ddFPEhPDz/pub?output=csv";

let csvData = [];

Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
        csvData = results.data;
    }
});

document.getElementById('cert-form').addEventListener('submit', function(e) {
    if(e) e.preventDefault();
    const roll = document.getElementById('roll-input').value.trim();
    const errorDiv = document.getElementById('cert-error');
    const resultDiv = document.getElementById('cert-result');
    const btn = document.getElementById('submit-btn');
    
    errorDiv.style.display = 'none';
    resultDiv.classList.remove('active');
    
    if (!csvData.length) {
        errorDiv.textContent = "Database is currently loading. Please try again in a few seconds.";
        errorDiv.style.display = 'block';
        return;
    }

    btn.innerHTML = '<i data-lucide="loader" class="spin"></i><span>Verifying...</span>';
    lucide.createIcons();

    setTimeout(() => {
        const student = csvData.find(row => row.Roll && row.Roll.toString().trim() === roll);
        
        if (student) {
            const rawName = student.Name.trim();
            
            document.getElementById('student-name').textContent = rawName;
            document.getElementById('student-roll').textContent = student.Roll;
            document.getElementById('student-year').textContent = student.Year || 'N/A';
            document.getElementById('student-section').textContent = student.Section || 'N/A';
            
            resultDiv.classList.add('active');
        } else {
            errorDiv.innerHTML = '<i data-lucide="alert-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Certificate not found. The roll number may be invalid.';
            errorDiv.style.display = 'block';
        }
        
        btn.innerHTML = '<i data-lucide="check-circle"></i><span>Verify Now</span>';
        lucide.createIcons();
    }, 600);
});

// Check for URL parameters to auto-verify
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rollParam = urlParams.get('roll');
    if (rollParam) {
        document.getElementById('roll-input').value = rollParam;
        
        // Wait for CSV to load before auto-submitting
        const checkDataInterval = setInterval(() => {
            if (csvData.length > 0) {
                clearInterval(checkDataInterval);
                document.getElementById('cert-form').dispatchEvent(new Event('submit'));
            }
        }, 100);
    }
});
