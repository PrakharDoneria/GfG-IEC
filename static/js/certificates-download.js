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

    btn.innerHTML = '<i data-lucide="loader" class="spin"></i><span>Searching...</span>';
    lucide.createIcons();

    setTimeout(() => {
        const student = csvData.find(row => row.Roll && row.Roll.toString().trim() === roll);
        
        if (student) {
            const rawName = student.Name.trim();
            const formattedName = rawName.replace(/ /g, '_');
            
            document.getElementById('student-name').textContent = rawName;
            document.getElementById('student-roll').textContent = student.Roll;
            document.getElementById('student-year').textContent = student.Year || 'N/A';
            document.getElementById('student-section').textContent = student.Section || 'N/A';
            
            const basePath = `../../public-cdn/certificates/${formattedName}/${formattedName}`;
            const pdfPath = `${basePath}.pdf`;
            const pngPath = `${basePath}.png`;
            
            document.getElementById('btn-download-pdf').href = pdfPath;
            document.getElementById('btn-download-png').href = pngPath;
            
            const previewImg = document.getElementById('cert-preview-img');
            previewImg.src = pngPath;
            previewImg.style.display = 'block';
            
            previewImg.onerror = function() {
                previewImg.style.display = 'none'; // hide if png is missing
            };

            // Setup sharing logic
            const verifyUrl = window.location.origin + '/certificates/verify/?roll=' + encodeURIComponent(student.Roll);
            const shareText = `I just earned my certificate from GFG IEC Chapter! Verify my achievement here: `;
            
            document.getElementById('btn-copy-link').onclick = () => {
                navigator.clipboard.writeText(verifyUrl).then(() => {
                    const btnSpan = document.querySelector('#btn-copy-link span');
                    btnSpan.textContent = 'Copied!';
                    setTimeout(() => btnSpan.textContent = 'Copy Verify Link', 2000);
                });
            };

            document.getElementById('btn-share-linkedin').onclick = () => {
                const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText + verifyUrl)}`;
                window.open(url, '_blank');
            };

            document.getElementById('btn-share-twitter').onclick = () => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`;
                window.open(url, '_blank');
            };

            document.getElementById('btn-share-whatsapp').onclick = () => {
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + verifyUrl)}`;
                window.open(url, '_blank');
            };
            
            resultDiv.classList.add('active');
        } else {
            errorDiv.innerHTML = '<i data-lucide="alert-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Roll number not found in our records.';
            errorDiv.style.display = 'block';
        }
        
        btn.innerHTML = '<i data-lucide="search"></i><span>Find Certificate</span>';
        lucide.createIcons();
    }, 600); // simulate tiny delay for UX
});
