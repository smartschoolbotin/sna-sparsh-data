
// ==========================================
// 📄 sparsh-core-test.js (હોસ્ટેડ ઑન GitHub)
// ==========================================

console.log("✅ GitHub સ્ક્રિપ્ટ સફળતાપૂર્વક લોડ થઈ ગઈ છે!");

// પેજ લોડ થાય એટલે UI બદલો
document.addEventListener("DOMContentLoaded", () => {
    const statusText = document.getElementById("statusText");
    const testBtn = document.getElementById("testBtn");

    if(statusText && testBtn) {
        statusText.innerHTML = "🎉 GitHub સ્ક્રિપ્ટ <b>સફળતાપૂર્વક</b> કનેક્ટ થઈ ગઈ છે!";
        statusText.className = "text-emerald-600 font-black mb-6";
        testBtn.classList.remove("hidden"); // બટન દેખાડો
    }

    // બટન પર ક્લિક ઈવેન્ટ લગાવો (જે Google Apps Script નું ફંક્શન કોલ કરશે)
    testBtn.addEventListener("click", () => {
        
        testBtn.innerHTML = "લોડ થાય છે...";
        testBtn.disabled = true;

        // 🚀 GitHub ની ફાઈલમાંથી ગુગલ એપ્સ સ્ક્રિપ્ટનું ફંક્શન કોલ કરી રહ્યા છીએ!
        google.script.run
            .withSuccessHandler((response) => {
                testBtn.innerHTML = "Google Backend થી ડેટા મંગાવો";
                testBtn.disabled = false;
                
                const resBox = document.getElementById("resultBox");
                resBox.classList.remove("hidden");
                resBox.innerHTML = `
                    <span style="color: blue;">સ્ટેટસ:</span> ${response.status} <br>
                    <span style="color: green;">મેસેજ:</span> ${response.message} <br>
                    <span style="color: gray;">સમય:</span> ${response.timestamp}
                `;
            })
            .withFailureHandler((err) => {
                alert("Error: " + err.message);
                testBtn.innerHTML = "Google Backend થી ડેટા મંગાવો";
                testBtn.disabled = false;
            })
            .getTestDataFromGoogle(); // આ Code.gs નું ફંક્શન છે
    });
});
