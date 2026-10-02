// 🚨 SILENT WATCHDOG ERROR TRACKER 🚨
window.addEventListener('error', function(event) {
    let errorDetails = {
        udise: (typeof currentSchool !== 'undefined' && currentSchool.udise) ? currentSchool.udise : 'Unknown',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        time: new Date().toLocaleString('en-IN')
    };
    
    // આ એરરને કોઈ પણ જાતના મેસેજ વગર ચુપચાપ સર્વર પર મોકલી દો
    if (typeof google !== 'undefined' && google.script) {
        google.script.run.logSilentError(errorDetails); 
    }
});

// પ્રોમિસ (Promise) માં આવતી એરર પકડવા માટે
window.addEventListener('unhandledrejection', function(event) {
    let errorDetails = {
        udise: (typeof currentSchool !== 'undefined' && currentSchool.udise) ? currentSchool.udise : 'Unknown',
        message: event.reason ? String(event.reason) : "Unhandled Promise Rejection",
        source: "Promise/Async Fetch",
        line: "N/A",
        time: new Date().toLocaleString('en-IN')
    };
    
    if (typeof google !== 'undefined' && google.script) {
        google.script.run.logSilentError(errorDetails);
    }
});

function goToMainMenu() { window.top.location.href = SCRIPT_URL + "?page=dashboard"; }
function switchToLocalFund() { window.top.location.href = SCRIPT_URL + "?page=local"; }
function logoutApp() { 
    console.log("🛑 [LOGOUT 1] લોગઆઉટ બટન દબાવ્યું.");
    Swal.fire({
        title: 'સુરક્ષિત લોગઆઉટ', text: 'તમારું એકાઉન્ટ લોગઆઉટ થઈ રહ્યું છે...',
        icon: 'success', timer: 1200, showConfirmButton: false, background: '#ffffff', color: '#1e293b'
    }).then(() => {
        console.log("🛑 [LOGOUT 2] 7-દિવસની મેમરી ડીલીટ કરી રહ્યા છીએ.");
        localStorage.removeItem("pmShriAuthData"); 
        localStorage.removeItem("pmShriUdise"); 
        
        console.log("🛑 [LOGOUT 3] ડેશબોર્ડ સંતાડીને લોગીન સ્ક્રીન લાવી રહ્યા છીએ.");
        let shell = document.getElementById('appShell');
        let overlay = document.getElementById('authOverlay');
        if(shell) shell.style.display = 'none';
        if(overlay) overlay.style.display = 'flex';
        
        document.getElementById('loginUdise').value = '';
        document.getElementById('loginPin').value = '';
        
        let btn = document.getElementById('loginBtn');
        if(btn) {
            btn.innerHTML = 'Login to Workspace <i data-feather="arrow-right"></i>';
            btn.disabled = false;
        }
        
        console.log("🛑 [LOGOUT 4] લોગઆઉટ પૂરું થયું! ફરીથી લોગીન કરવા માટે તૈયાર.");
    });
}
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

let currentSchool = { udise: null, name: null, schemeType: null, taluka: null };
let dynamicVendorsList = [], dynamicComps = [];
let customHeadsMap = {};
let snaBanksMap = {};
let patrakData = []; 
let rawEpayData = []; let rawClaimsData = []; let rawMtlData = [];

let currentReportType = 'cashbook'; let cashbookStyle = 'ONE'; let globalScheme = 'ALL';

// 🚀 NEW: WHATSAPP SHARE
window.shareVoucherWA = function() {
    let vNo = document.getElementById('vNo').value || 'Auto';
    let payee = document.getElementById('vPayee').value;
    let amt = document.getElementById('vAmt').value;
    let pText = document.getElementById('vVoucherText').value;
    if(!payee || !amt) return Swal.fire('Oops!', 'પહેલા વાઉચરની વિગત ભરો.', 'info');
    let text = `નમસ્તે *${payee}*,\n\nતમારું પેમેન્ટ વાઉચર તૈયાર છે.\n🔹 *વાઉચર નં:* ${vNo}\n🔹 *રકમ:* રૂ. ${amt}/-\n🔹 *વિગત:* ${pText}\n\nઆભાર,\n*${currentSchool.name}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 🚀 NEW: SKELETON UI GENERATOR
window.getSkeletonHTML = function() {
    let html = '';
    for(let i=0; i<5; i++) {
        html += `<tr class="border-b border-slate-50"><td class="p-5"><div class="skeleton-box w-16"></div></td><td class="p-5"><div class="skeleton-box w-48 mb-2"></div><br><div class="skeleton-box w-32"></div></td><td class="p-5"><div class="skeleton-box w-24 mb-1"></div><br><div class="skeleton-box w-16"></div></td><td class="p-5 text-right"><div class="skeleton-box w-20"></div></td></tr>`;
    }
    return html;
}

// 🟢 🌟 SMART UNIVERSAL IMAGE UPLOAD ENGINE 🌟 🟢
const DEFAULT_PMSHRI_LOGO = "https://i.ibb.co/8DsJSWWz/pm-shri-logo.jpg"; 
const DEFAULT_SSA_LOGO = "https://i.ibb.co/97B7MWw/samgrasiksha-cropped.png"; 

let logoSettings = { 
    schoolLogoUrl: "", useSchoolLogo: false, 
    pmShriLogoUrl: "", usePmShri: true, 
    ssaLogoUrl: "", useSsa: true 
};

function handleLogoUpload(event, type) {
    let file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return Swal.fire('Error', 'ફાઈલ 2MB થી નાની હોવી જોઈએ.', 'error');

    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let MAX_SIZE = 300; 
            let width = img.width; let height = img.height;
            
            if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            
            canvas.width = width; canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            let base64Data = canvas.toDataURL('image/png');
            
            document.getElementById('setting' + type + 'Logo').value = base64Data;
            document.getElementById('icon' + type).classList.add('hidden');
            let preview = document.getElementById('preview' + type);
            preview.src = base64Data;
            preview.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function loadLogoSettings() {
    let saved = JSON.parse(localStorage.getItem('pmShriLogos_' + currentSchool.udise));
    if(saved) logoSettings = { ...logoSettings, ...saved }; 
    
    let chkSchool = document.getElementById('settingUseSchoolLogo');
    let chkPmShri = document.getElementById('settingUsePmShriLogo');
    let chkSsa = document.getElementById('settingUseSsaLogo');
    
    if(chkSchool) chkSchool.checked = logoSettings.useSchoolLogo;
    if(chkPmShri) chkPmShri.checked = logoSettings.usePmShri;
    if(chkSsa) chkSsa.checked = logoSettings.useSsa;

    const loadPreview = (type, url) => {
        let input = document.getElementById('setting' + type + 'Logo');
        if(input) input.value = url || "";
        if(url && url.startsWith('data:image')) {
            let icon = document.getElementById('icon' + type);
            let preview = document.getElementById('preview' + type);
            if(icon) icon.classList.add('hidden');
            if(preview) { preview.src = url; preview.classList.remove('hidden'); }
        }
    };

    loadPreview('School', logoSettings.schoolLogoUrl);
    loadPreview('PmShri', logoSettings.pmShriLogoUrl);
    loadPreview('Ssa', logoSettings.ssaLogoUrl);
    if(typeof feather !== 'undefined') feather.replace();
}

function saveLogoSettings() {
    logoSettings.schoolLogoUrl = document.getElementById('settingSchoolLogo').value;
    logoSettings.useSchoolLogo = document.getElementById('settingUseSchoolLogo').checked;
    
    logoSettings.pmShriLogoUrl = document.getElementById('settingPmShriLogo').value;
    logoSettings.usePmShri = document.getElementById('settingUsePmShriLogo').checked;
    
    logoSettings.ssaLogoUrl = document.getElementById('settingSsaLogo').value;
    logoSettings.useSsa = document.getElementById('settingUseSsaLogo').checked;
    
    localStorage.setItem('pmShriLogos_' + currentSchool.udise, JSON.stringify(logoSettings));
    Toast.fire({icon: 'success', title: 'તમામ લોગો અને સેટિંગ્સ સેવ થઈ ગયા!'});
}

let activeSchemes = []; let vOptionsGlobal = []; let hOptionsGlobal = [];
let globalVendorsFull = []; let vendorPage = 1; const VENDORS_PER_PAGE = 9;
let globalDocsFull = []; let docsPage = 1; const DOCS_PER_PAGE = 8;
let currentWizardStep = 1;

let _today = new Date(); let _cYear = _today.getFullYear(); let _cMonth = _today.getMonth() + 1;
let _sYear = _cMonth < 4 ? _cYear - 1 : _cYear; let _eYear = _sYear + 1;
const fyYear = `${_sYear}-${String(_eYear).slice(-2)}`;
const openingBalDate = `01-04-${_sYear}`;
const closingBalDate = `31-03-${_eYear}`;

document.addEventListener("DOMContentLoaded", () => {
    if(typeof feather !== 'undefined') feather.replace();
    fastBootSystem(); 

    let vDateEl = document.getElementById('vDate'); if(vDateEl) vDateEl.valueAsDate = new Date();

    let chipsGu = document.getElementById('monthFilterChips');
    if(chipsGu) {
        chipsGu.innerHTML = `
            <label class="cursor-pointer"><input type="checkbox" id="selectAllMonths" onchange="toggleAllMonths(this)" checked class="hidden peer"><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white transition shadow-sm border border-slate-200 peer-checked:border-indigo-600">બધા જ (All)</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="apr" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Apr</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="may" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">May</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="jun" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Jun</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="jul" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Jul</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="aug" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Aug</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="sep" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Sep</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="oct" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Oct</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="nov" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Nov</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="dec" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Dec</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="jan" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Jan</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="feb" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Feb</div></label>
            <label class="cursor-pointer"><input type="checkbox" value="mar" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 transition shadow-sm border border-slate-200 peer-checked:border-indigo-300">Mar</div></label>
        `;
    }
});

function fastBootSystem() {
    console.log("⚡ [BOOT 1] fastBootSystem ચાલુ થયું.");
    let savedAuthStr = localStorage.getItem("pmShriAuthData");
    
    if (savedAuthStr) {
        let authData = JSON.parse(savedAuthStr);
        let now = Date.now();
        let sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (now - (authData.loginTimestamp || 0) < sevenDays) {
            console.log("✅ [BOOT 3] સેશન વેલિડ છે! ઓટો-લોગીન કરી રહ્યા છીએ.");
            currentSchool = { udise: authData.udise, name: authData.name, schemeType: authData.schemeType, taluka: authData.taluka, district: authData.district, state: authData.state };
            let nameEl = document.getElementById('uiSchoolName'); if(nameEl) nameEl.innerText = authData.name; 
            let udiseEl = document.getElementById('uiUdise'); if(udiseEl) udiseEl.innerText = authData.udise;

            let userPlan = String(authData.planType || "COMBO").toUpperCase().replace(/[\s_]/g, '');
            let userSchemes = String(authData.schemeType || "").toUpperCase().replace(/[\s_]/g, '');
            let isDemo = userPlan.includes("DEMO") || userPlan.includes("₹0");
            let isAllInOne = userPlan.includes("ALLINONE");
            
            let isSnaAllowed = userPlan.includes("COMBO") || userPlan.includes("PMSHRI") || userPlan.includes("SSA") || isAllInOne || isDemo || userSchemes.includes("GJ302") || userSchemes.includes("GJ209");
            let isLocalAllowed = userPlan.includes("COMBO") || userPlan.includes("LOCAL") || isAllInOne || isDemo || userSchemes.includes("LOCAL");

            if (!isSnaAllowed) {
                Swal.fire({icon: 'error', title: 'Access Denied', text: 'તમારો પ્લાન SNA SPARSH માટે એક્ટિવ નથી. કૃપા કરીને પ્લાન અપગ્રેડ કરો.', allowOutsideClick: false, showConfirmButton: false});
                return;
            }

            let badgeContainer = document.getElementById('planDisplayBadge');
            if (badgeContainer) {
                if (isDemo) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase ml-3 animate-pulse">⏳ 3-DAY DEMO</span>`;
                else if (isAllInOne) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase ml-3">⭐ ALL IN ONE PRO</span>`;
            }

            let btnSwitch = document.querySelector('button[onclick="switchToLocalFund()"]');
            if (btnSwitch) {
                btnSwitch.style.display = isLocalAllowed ? 'flex' : 'none';
            }

            let overlay = document.getElementById('authOverlay'); if(overlay) overlay.style.display = 'none'; 
            let shell = document.getElementById('appShell'); if(shell) shell.style.display = 'flex';
            
            if(typeof loadGujaratiNames === 'function') loadGujaratiNames(); 
            if(typeof initSchemes === 'function') initSchemes(); 
            if(typeof loadWizardDraft === 'function') loadWizardDraft(); 
            if(typeof loadLogoSettings === 'function') loadLogoSettings();
            if(typeof syncSchoolTemplateConfig === 'function') syncSchoolTemplateConfig(); 

            let savedDashboard = window.lastDashboardRes || JSON.parse(localStorage.getItem('pmShriDash_' + authData.udise));
            if (savedDashboard && typeof renderDashboardUI === 'function') renderDashboardUI(savedDashboard);
            
            if(typeof loadVendorsData === 'function') loadVendorsData(false);
            if(typeof loadComponentsData === 'function') loadComponentsData();
            if(typeof loadDocs === 'function') loadDocs(false);
            
            silentBackgroundSync(authData.udise);
            return; 
        } else {
            console.log("⚠️ [BOOT 4] સેશન એક્સપાયર થઈ ગયું છે. મેમરી સાફ કરી રહ્યા છીએ.");
            localStorage.removeItem("pmShriAuthData");
        }
    }
    let lastUdise = localStorage.getItem("pmShriUdise");
    if(lastUdise) { let uEl = document.getElementById('loginUdise'); if(uEl) uEl.value = lastUdise; }
}

function executeMasterSync() {
    if (!currentSchool || !currentSchool.udise) {
        return Swal.fire('Error', 'School data missing! Please login again.', 'error');
    }

    let udise = String(currentSchool.udise).replace(/[^0-9]/g, '');

    Swal.fire({
        title: '<span class="text-emerald-600">Global Sync Active 🔄</span>',
        html: 'સિસ્ટમ તમામ ડેટા (વેન્ડર, ઓર્ડર, દફ્તર, રિપોર્ટ્સ) લાઈવ અપડેટ કરી રહી છે...<br><br><b class="text-indigo-600 text-sm">આમાં થોડી સેકન્ડ્સ લાગી શકે છે, કૃપા કરીને રાહ જુઓ...</b>',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    localStorage.removeItem('pmShriVendors_' + udise);
    localStorage.removeItem('pmShriOrders_' + udise);
    localStorage.removeItem('pmShriDash_' + udise);
    localStorage.removeItem('pmShriComps_' + udise);
    if(typeof google !== 'undefined') google.script.run.clearOrdersCache(udise);

    try {
        if(typeof syncSchoolTemplateConfig === 'function') syncSchoolTemplateConfig();
        if(typeof loadComponentsData === 'function') loadComponentsData();
        if(typeof loadVendorsData === 'function') loadVendorsData(true);
        if(typeof loadDocs === 'function') loadDocs(true);
        if(typeof loadOfficeRegistersData === 'function') loadOfficeRegistersData(udise);
        
        google.script.run
        .withSuccessHandler(res => {
            if(res && res.success !== false) {
                if(typeof localforage !== 'undefined') localforage.setItem('pmShriDash_' + udise, JSON.stringify(res));
                if(typeof renderDashboardUI === 'function') renderDashboardUI(res);
            }
            Swal.fire({
                icon: 'success', title: '100% Synced! ✨', text: 'તમામ મોડ્યુલનો લાઈવ ડેટા સફળતાપૂર્વક અપડેટ થઈ ગયો છે!',
                timer: 2500, showConfirmButton: false
            });
        })
        .withFailureHandler(err => {
            Swal.fire('Warning', 'ડેટા લાવવામાં નેટવર્ક એરર: ' + err.message, 'warning');
        }).getSchoolPatrakCData(udise);
        
    } catch(e) {
        Swal.fire('Error', 'Sync Failed: ' + e.message, 'error');
    }
}

function silentBackgroundSync(udise) {
    google.script.run.withSuccessHandler(res => {
        if(res && res.success) { 
            localforage.setItem('pmShriDash_' + udise, JSON.stringify(res)); 
            localStorage.removeItem('pmShriDash_' + udise); 
            if (typeof renderDashboardUI === 'function') renderDashboardUI(res); 
        }
    }).fetchDashboardDataPRO(udise);
}

window.saveWizardDraft = function() {
    try {
        let cards = [];
        document.querySelectorAll('.vendor-card').forEach(card => {
            let vSel = card.querySelector('.vendor-select');
            let hSel = card.querySelector('.comp-select');
            cards.push({
                vendor: vSel ? (vSel.value || "") : "",
                head:   hSel ? (hSel.value || "") : "",
                bill:   card.querySelector('.bill-input') ? card.querySelector('.bill-input').value : "",
                amount: card.querySelector('.row-input') ? card.querySelector('.row-input').value : ""
            });
        });

        let draft = {
            orderType:      document.getElementById('orderType') ? document.getElementById('orderType').value : 'RECURRING',
            slsCode:        document.getElementById('wizardSlsCode') ? document.getElementById('wizardSlsCode').value : '',
            step:           typeof currentWizardStep !== 'undefined' ? currentWizardStep : 1,
            cards:          cards,
            orderNo:        document.getElementById('officeOrderNo') ? document.getElementById('officeOrderNo').value : '',
            billRegNo:      document.getElementById('billRegNo') ? document.getElementById('billRegNo').value : '',
            billRegPage:    document.getElementById('billRegPage') ? document.getElementById('billRegPage').value : '',
            orderDate:      document.getElementById('orderDateInput') ? document.getElementById('orderDateInput').value : '',
            centralClaimNo: document.getElementById('centralClaimNo') ? document.getElementById('centralClaimNo').value : '',
            stateClaimNo:   document.getElementById('stateClaimNo') ? document.getElementById('stateClaimNo').value : ''
        };

        if (currentSchool && currentSchool.udise) {
            localStorage.setItem('pmShriWizardDraft_' + currentSchool.udise, JSON.stringify(draft));
        }
    } catch (e) { console.warn('saveWizardDraft error:', e); }
};

window.loadWizardDraft = function() {
    if (!currentSchool || !currentSchool.udise) return;
    let draftStr = localStorage.getItem('pmShriWizardDraft_' + currentSchool.udise);
    
    if (!draftStr) {
        let mc = document.getElementById('mobileCardsContainer');
        if (mc) mc.innerHTML = '';
        currentWizardStep = 1;
        if (typeof window.goToStep === 'function') window.goToStep(1, true);
        return;
    }

    try {
        let draft = JSON.parse(draftStr);
        let mc = document.getElementById('mobileCardsContainer');
        if (mc) mc.innerHTML = '';

        let ot = document.getElementById('orderType'); if (ot) ot.value = draft.orderType || 'RECURRING';
        let scEl = document.getElementById('wizardSlsCode'); if (scEl && draft.slsCode) scEl.value = draft.slsCode;

        if (draft.cards && draft.cards.length > 0) {
            draft.cards.forEach(c => {
                if (typeof window.addVendorCard === 'function') window.addVendorCard(c.vendor, c.head, c.bill, c.amount);
            });
        }

        if (document.getElementById('officeOrderNo')) document.getElementById('officeOrderNo').value = draft.orderNo || '';
        if (document.getElementById('billRegNo'))     document.getElementById('billRegNo').value     = draft.billRegNo || '';
        if (document.getElementById('billRegPage'))   document.getElementById('billRegPage').value   = draft.billRegPage || '';
        if (document.getElementById('orderDateInput')) document.getElementById('orderDateInput').value = draft.orderDate || '';
        if (document.getElementById('centralClaimNo')) document.getElementById('centralClaimNo').value = draft.centralClaimNo || '';
        if (document.getElementById('stateClaimNo'))  document.getElementById('stateClaimNo').value  = draft.stateClaimNo || '';

        let targetStep = draft.step || 1;
        currentWizardStep = targetStep;
        if (typeof window.goToStep === 'function') window.goToStep(targetStep, true);

        if (targetStep >= 2) {
            setTimeout(function() {
                if (typeof window.updatePreviewMath === 'function') window.updatePreviewMath();
            }, 100);
        }
    } catch (e) {
        let mc = document.getElementById('mobileCardsContainer'); if (mc) mc.innerHTML = '';
        if (typeof window.goToStep === 'function') window.goToStep(1, true);
    }
};

const escapeHtml = (unsafe) => { if(!unsafe) return ""; return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); };
function formatINR(amount) { return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0); }

function getGujaratiWords(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "અમાન્ય નંબર";
    let number = parseInt(amount);
    if (number === 0) return "શૂન્ય રૂપિયા પૂરા";

    const map = {
    1: "એક", 2: "બે", 3: "ત્રણ", 4: "ચાર", 5: "પાંચ", 6: "છ", 7: "સાત", 8: "આઠ", 9: "નવ",
    10: "દસ", 11: "અગિયાર", 12: "બાર", 13: "તેર", 14: "ચૌદ", 15: "પંદર", 16: "સોળ", 17: "સત્તર", 18: "અઢાર", 19: "ઓગણીસ",
    20: "વીસ", 21: "એકવીસ", 22: "બાવીસ", 23: "ત્રેવીસ", 24: "ચોવીસ", 25: "પચ્ચીસ", 26: "છવ્વીસ", 27: "સત્તાવીસ", 28: "અઠ્ઠાવીસ", 29: "ઓગણત્રીસ",
    30: "ત્રીસ", 31: "એકત્રીસ", 32: "બત્રીસ", 33: "તેંત્રીસ", 34: "ચોત્રીસ", 35: "પાંત્રીસ", 36: "છત્રીસ", 37: "સાડત્રીસ", 38: "આડત્રીસ", 39: "ઓગણચાળીસ",
    40: "ચાળીસ", 41: "એકતાળીસ", 42: "બેતાળીસ", 43: "તેતાળીસ", 44: "ચુમ્માળીસ", 45: "પિસ્તાળીસ", 46: "છેંતાળીસ", 47: "સુડતાળીસ", 48: "અડતાળીસ", 49: "ઓગણપચાસ",
    50: "પચાસ", 51: "એકાવન", 52: "બાવન", 53: "ત્રેપન", 54: "ચોપન", 55: "પંચાવન", 56: "છપ્પન", 57: "સત્તાવન", 58: "અઠ્ઠાવન", 59: "ઓગણસાઠ",
    60: "સાઠ", 61: "એકસઠ", 62: "બાસઠ", 63: "ત્રેસઠ", 64: "ચોસઠ", 65: "પાંસઠ", 66: "છાસઠ", 67: "સડસઠ", 68: "અડસઠ", 69: "ઓગણસિત્તેર",
    70: "સિત્તેર", 71: "ઈકોતેર", 72: "બોતેર", 73: "તોત્તેર", 74: "ચુંબોતેર", 75: "પંચોતેર", 76: "છોત્તેર", 77: "સિત્યોત્તર", 78: "ઈઠયોતેર", 79: "ઓગણએંસી",
    80: "એંસી", 81: "એક્યાશી", 82: "બ્યાશી", 83: "ત્યાંશી", 84: "ચોર્યાશી", 85: "પંચ્યાશી", 86: "છ્યાંશી", 87: "સિત્યાસી", 88: "ઈઠ્યાસી", 89: "નેવ્યાસી",
    90: "નેવું", 91: "એકાણું", 92: "બાણું", 93: "ત્રાણું", 94: "ચોરાણું", 95: "પંચાણું", 96: "છન્નું", 97: "સતાણું", 98: "અઠ્ઠાણું", 99: "નવ્વાણું"
    };

    function convert(n) {
    if (n === 0) return "";
    let result = "";
    const crore = Math.floor(n / 10000000);
    if (crore > 0) { result += convert(crore) + " કરોડ "; n %= 10000000; }
    const lakh = Math.floor(n / 100000);
    if (lakh > 0) { result += convert(lakh) + " લાખ "; n %= 100000; }
    const thousand = Math.floor(n / 1000);
    if (thousand > 0) { result += convert(thousand) + " હજાર "; n %= 1000; }
    const hundred = Math.floor(n / 100);
    if (hundred > 0) {
        if (hundred === 2) result += "બસો ";
        else result += map[hundred] + " સો ";
        n %= 100;
    }
    if (n > 0) { result += (map[n] || "") + " "; }
    return result.trim();
    }

    return convert(number) + " રૂપિયા પૂરા";
}

function generateWords(inputId, outputId) { let val = parseFloat(document.getElementById(inputId).value) || 0; let out = document.getElementById(outputId); if(out) out.innerText = val > 0 ? getGujaratiWords(val) : ""; }

function initTomSelect(el, optionsArray, placeholder, defaultValue="") {
    if(!el) return;
    
    let currentVal = defaultValue || "";
    if (el.tomselect) {
        let existingVal = el.tomselect.getValue();
        if (existingVal !== undefined && existingVal !== null && existingVal !== "") {
            currentVal = existingVal;
        }
        el.tomselect.destroy();
    } else if (el.value !== undefined && el.value !== null && el.value !== "") {
        currentVal = el.value;
    }

    el.innerHTML = ''; 
    
    let tsOptions = (optionsArray || [])
        .filter(opt => opt && opt.val && String(opt.val).trim() !== "")
        .map(opt => ({
            value: String(opt.val).trim(),
            text: String(opt.txt || opt.val).trim() 
        }));

    let itemArray = [];
    if (currentVal && String(currentVal).trim() !== "") {
            itemArray = [String(currentVal).trim()];
    }

    try {
        new TomSelect(el, {
            options: tsOptions,
            valueField: 'value',
            labelField: 'text',
            searchField: 'text',
            create: true,
            placeholder: placeholder,
            items: itemArray,
            maxOptions: 100 
        });
    } catch (error) { console.error(error); }
}

function updateGlobalOptions(selectedSchemeCode = "ALL") {
    vOptionsGlobal = dynamicVendorsList.map(v => ({
        val: escapeHtml(v.name || v), 
        txt: escapeHtml(v.name || v)
    }));
    
    let combinedMap = new Map();
    let targetSchemeCode = String(selectedSchemeCode).toUpperCase().trim();
    let schoolTagsStr = String(currentSchool.schemeType || currentSchool.instType || "").toUpperCase();
    let schoolTags = schoolTagsStr.split(',').map(s => s.trim()).filter(s => s !== "");

    if (dynamicComps && dynamicComps.length > 0) {
        dynamicComps.forEach(c => {
            let compSlsTagsStr = String(c.slsCode || c.SLS_CODE || "ALL").toUpperCase();
            let compInstTagsStr = String(c.schemeCode || c.SCHEME_TYPE || c.scheme_type || "ALL").toUpperCase();
            
            let compSlsTags = compSlsTagsStr.split(',').map(s => s.trim()).filter(s => s !== "");
            let compInstTags = compInstTagsStr.split(',').map(s => s.trim()).filter(s => s !== "");
            
            let isSlsMatch = (targetSchemeCode === "ALL" || compSlsTags.includes("ALL") || compSlsTags.includes(targetSchemeCode) || compSlsTags.some(t => targetSchemeCode.includes(t)));
            
            let isInstMatch = compInstTags.includes("ALL") || compInstTags.some(compTag => 
                schoolTags.some(schoolTag => schoolTag === compTag || schoolTag.includes(compTag) || compTag.includes(schoolTag))
            );

            if (!isInstMatch && schoolTags.includes("GJ302") && compInstTags.includes("PM_SHRI_SCHOOL")) isInstMatch = true;
            if (!isInstMatch && schoolTags.includes("GJ209") && compInstTags.includes("SSA")) isInstMatch = true;

            if(isSlsMatch && isInstMatch) {
                let en = String(c.nameEn || c.NAME_EN || c.name_en || "").trim();
                let gu = String(c.nameGu || c.NAME_GU || c.name_gu || "").trim();
                if(en && en.toUpperCase() !== "NAME_EN" && en !== "-") {
                    combinedMap.set(en, gu);
                }
            }
        });

        if (combinedMap.size === 0) {
            dynamicComps.forEach(c => {
                let compSlsTagsStr = String(c.slsCode || c.SLS_CODE || "ALL").toUpperCase();
                let compSlsTags = compSlsTagsStr.split(',').map(s => s.trim()).filter(s => s !== "");
                let isSlsMatch = (targetSchemeCode === "ALL" || compSlsTags.includes("ALL") || compSlsTags.includes(targetSchemeCode) || compSlsTags.some(t => targetSchemeCode.includes(t)));

                if(isSlsMatch) {
                    let en = String(c.nameEn || c.NAME_EN || c.name_en || "").trim();
                    let gu = String(c.nameGu || c.NAME_GU || c.name_gu || "").trim();
                    if(en && en.toUpperCase() !== "NAME_EN" && en !== "-") {
                        combinedMap.set(en, gu);
                    }
                }
            });
        }
    }
    
    hOptionsGlobal = [];
    combinedMap.forEach((guName, enName) => {
        let displayText = String(enName).trim();
        if (guName && String(guName).trim() !== "" && guName !== enName && guName !== "-") {
            displayText = `${displayText} - (${String(guName).trim()})`; 
        }
        hOptionsGlobal.push({ val: String(enName).trim(), txt: String(displayText).trim() });
    });
}

function refreshAllHeadDropdowns() {
    let compSelects = document.querySelectorAll('.comp-select');
    let standaloneSelects = document.querySelectorAll('.comp-select-standalone');
    
    standaloneSelects.forEach(el => { 
        let currentVal = "";
        if (el.tomselect) { currentVal = el.tomselect.getValue(); el.tomselect.clear(); } 
        else { currentVal = el.value; }
        initTomSelect(el, hOptionsGlobal, "🔍 Search Budget Head...", currentVal); 
    });
    
    compSelects.forEach(el => { 
        let currentVal = "";
        if (el.tomselect) { currentVal = el.tomselect.getValue(); el.tomselect.clear(); } 
        else { currentVal = el.value; }
        initTomSelect(el, hOptionsGlobal, "🔍 Search Budget Head...", currentVal); 
    });
    
    let oldH = document.getElementById('oldHead'); 
    if(oldH) {
        let currentVal = "";
        if (oldH.tomselect) { currentVal = oldH.tomselect.getValue(); oldH.tomselect.clear(); } 
        else { currentVal = oldH.value; }
        initTomSelect(oldH, hOptionsGlobal, "🔍 Select Head...", currentVal);
    }
}

function refreshAllVendorDropdowns() {
    let vendorSelects = document.querySelectorAll('.vendor-select, .vendor-select-standalone');
    let vOpts = (typeof vOptionsGlobal !== 'undefined' && vOptionsGlobal.length > 0) ? vOptionsGlobal : [];
    
    vendorSelects.forEach(el => {
        let currentVal = "";
        if (el.tomselect) {
            currentVal = el.tomselect.getValue();
            el.tomselect.clear();
        } else {
            currentVal = el.value;
        }
        initTomSelect(el, vOpts, "🔍 Search Vendor...", currentVal);
    });
}

function getGujHeadName(enName) {
    if(!enName || enName === "-" || enName === "SNA Grant") return enName;
    let cleanEn = String(enName).toUpperCase().trim();
    if(customHeadsMap && customHeadsMap[cleanEn]) return customHeadsMap[cleanEn];
    if(dynamicComps && dynamicComps.length > 0) {
        let found = dynamicComps.find(c => String(c.nameEn).toUpperCase().trim() === cleanEn || String(c.code).toUpperCase().trim() === cleanEn);
        if(found && found.nameGu) return found.nameGu;
    }
    let preProcessed = enName.replace(/\bClass VI XII\b/gi, 'ધોરણ ૬ થી ૧૨').replace(/\bClass I V\b/gi, 'ધોરણ ૧ થી ૫').replace(/\bClass I VIII\b/gi, 'ધોરણ ૧ થી ૮').replace(/\bFacility\b/gi, 'સુવિધા');
    return preProcessed; 
}

function getEnHeadName(guName) {
    if(!guName || guName === "-" || guName === "SNA Grant") return guName;
    let cleanName = String(guName).toUpperCase().trim();
    for(let enKey in customHeadsMap) {
        if(customHeadsMap[enKey].toUpperCase().trim() === cleanName || enKey.toUpperCase().trim() === cleanName) return enKey;
    }
    if(dynamicComps && dynamicComps.length > 0) {
        let found = dynamicComps.find(c => String(c.nameGu).toUpperCase().trim() === cleanName || String(c.nameEn).toUpperCase().trim() === cleanName || String(c.code).toUpperCase().trim() === cleanName);
        if(found && found.nameEn) return found.nameEn;
    }
    return guName; 
}

function formatClaimDisplay(rawClaim) {
    if(!rawClaim || rawClaim === "MANUAL-ENTRY" || rawClaim === "-") return rawClaim || "-";
    let parts = rawClaim.split("/");
    if(parts.length === 2) {
        return `<div class="text-[9px] leading-tight mt-1"><span class="text-blue-700 font-bold bg-blue-50 px-1 rounded border border-blue-200">C(60%): ${parts[0].trim()}</span><br><span class="text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200 mt-1 inline-block">S(40%): ${parts[1].trim()}</span></div>`;
    } else if (rawClaim.includes("|")) {
        return rawClaim.split("|").join("<br>");
    }
    return escapeHtml(rawClaim);
}

function initSchemes() {
    let savedSchemes = JSON.parse(localStorage.getItem('pmShriSchemes_' + currentSchool.udise)) || [];
    let rawTagsStr = String(currentSchool.schemeType || currentSchool.instType || "").toUpperCase();
    let adminTags = rawTagsStr.split(',').map(s => s.trim()).filter(s => s !== "");
    
    adminTags.forEach(tag => {
        if (tag.includes("GJ") || tag.includes("SSA") || tag.includes("PM")) {
            let tempName = tag === "GJ302" ? "PM SHRI" : (tag === "GJ209" ? "Samagra Shiksha" : tag + " Scheme");
            let isAlreadySaved = savedSchemes.find(s => s.code === tag);
            if (!isAlreadySaved) {
                savedSchemes.push({ code: tag, name: tempName });
            }
        }
    });
    
    if (savedSchemes.length === 0) {
        savedSchemes = [
            { code: 'GJ302', name: 'PM SHRI' }, 
            { code: 'GJ209', name: 'Samagra Shiksha' }
        ];
    }
    
    activeSchemes = savedSchemes;
    localStorage.setItem('pmShriSchemes_' + currentSchool.udise, JSON.stringify(activeSchemes));
    
    if(typeof renderActiveSchemes === 'function') renderActiveSchemes(); 
    if(typeof updateSchemeDropdowns === 'function') updateSchemeDropdowns();
}

function renderActiveSchemes() {
    let cList = document.getElementById('activeSchemesList'); if(!cList) return; cList.innerHTML = '';
    activeSchemes.forEach((s, i) => { cList.innerHTML += `<div class="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"><span class="font-bold text-slate-800 text-sm">${s.code}</span><span class="text-xs text-slate-500">${s.name}</span><button onclick="removeScheme(${i})" class="text-rose-500 hover:bg-rose-50 p-1 rounded"><i data-feather="x" class="w-3 h-3"></i></button></div>`; });
    if(typeof feather !== 'undefined') feather.replace();
}

function updateSchemeDropdowns() {
    let gSel = document.getElementById('globalSchemeSelector'); let wSel = document.getElementById('wizardSlsCode'); let oSel = document.getElementById('oldSlsCode'); let setSel = document.getElementById('settingScheme');
    let gVal = gSel ? gSel.value : 'ALL';
    if(gSel) { gSel.innerHTML = '<option value="ALL">All Schemes</option>'; activeSchemes.forEach(s => gSel.innerHTML += `<option value="${s.code}">${s.code} - ${s.name}</option>`); gSel.value = gVal; }
    if(wSel) { 
        wSel.innerHTML = ''; 
        activeSchemes.forEach(s => wSel.innerHTML += `<option value="${s.code}">${s.code} - ${s.name}</option>`); 
        updateGlobalOptions(wSel.value);
        refreshAllHeadDropdowns();
    }
    if(oSel) { oSel.innerHTML = ''; activeSchemes.forEach(s => oSel.innerHTML += `<option value="${s.code}">${s.code} - ${s.name}</option>`); }
    if(setSel) { setSel.innerHTML = ''; activeSchemes.forEach(s => setSel.innerHTML += `<option value="${s.code}">${s.code} - ${s.name}</option>`); loadBankSettings(); }
}

function saveNewScheme() {
    let code = document.getElementById('newSchemeCode').value.toUpperCase().trim(); let name = document.getElementById('newSchemeName').value.trim();
    if(!code || !name) return Swal.fire('Error','Please enter both code and name.','error');
    activeSchemes.push({code: code, name: name}); localStorage.setItem('pmShriSchemes_' + currentSchool.udise, JSON.stringify(activeSchemes));
    document.getElementById('newSchemeCode').value = ''; document.getElementById('newSchemeName').value = '';
    initSchemes(); Toast.fire({icon:'success', title:'Scheme Added!'});
}

function removeScheme(index) { activeSchemes.splice(index, 1); localStorage.setItem('pmShriSchemes_' + currentSchool.udise, JSON.stringify(activeSchemes)); initSchemes(); }

function loadGujaratiNames() {
    let saved = JSON.parse(localStorage.getItem('pmShriGujNames_' + currentSchool.udise) || "{}");
    document.getElementById('settingGujSchool').value = saved.school || ""; document.getElementById('settingGujTaluka').value = saved.taluka || ""; document.getElementById('settingGujDistrict').value = saved.district || "";
}

function saveGujaratiNames() {
    let obj = { school: document.getElementById('settingGujSchool').value, taluka: document.getElementById('settingGujTaluka').value, district: document.getElementById('settingGujDistrict').value };
    localStorage.setItem('pmShriGujNames_' + currentSchool.udise, JSON.stringify(obj)); Toast.fire({icon: 'success', title: 'Gujarati Names Saved!'});
}

function renderCustomHeadsUI() {
    let cList = document.getElementById('customHeadsList'); if(!cList) return; cList.innerHTML = ''; let keys = Object.keys(customHeadsMap);
    if(keys.length === 0) { cList.innerHTML = '<span class="text-sm font-semibold text-slate-400">No custom heads added.</span>'; return; }
    keys.forEach(k => { cList.innerHTML += `<div class="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"><span class="font-bold text-slate-800 text-sm">${k}</span><span class="text-xs text-slate-500">${customHeadsMap[k]}</span><button onclick="removeCustomHead('${k}')" class="text-rose-500 hover:bg-rose-50 p-1 rounded"><i data-feather="x" class="w-3 h-3"></i></button></div>`; });
    if(typeof feather !== 'undefined') feather.replace();
}

function saveCustomHeadWithGujarati() {
    let en = document.getElementById('customHeadEn').value.trim(); let gu = document.getElementById('customHeadGu').value.trim();
    if(!en || !gu) return Swal.fire('Error', 'Please enter both English and Gujarati names.', 'error');
    customHeadsMap[en] = gu; localStorage.setItem('pmShriCustomHeadsMap_' + currentSchool.udise, JSON.stringify(customHeadsMap));
    document.getElementById('customHeadEn').value = ''; document.getElementById('customHeadGu').value = '';
    renderCustomHeadsUI(); updateGlobalOptions(); refreshAllHeadDropdowns(); Toast.fire({icon: 'success', title: 'Custom Head Added!'});
}

function removeCustomHead(key) { delete customHeadsMap[key]; localStorage.setItem('pmShriCustomHeadsMap_' + currentSchool.udise, JSON.stringify(customHeadsMap)); renderCustomHeadsUI(); updateGlobalOptions(); refreshAllHeadDropdowns(); }

function loadBankSettings() {
    let savedBanks = JSON.parse(localStorage.getItem('pmShriBanks_' + currentSchool.udise)); if(savedBanks) snaBanksMap = savedBanks;
    let sc = document.getElementById('settingScheme').value; let bank = snaBanksMap[sc] || {name:'', accNo:'', ifsc:''};
    document.getElementById('settingBankName').value = bank.name; document.getElementById('settingIfsc').value = bank.ifsc; document.getElementById('settingAccNo').value = bank.accNo;
}

function saveBankSettings() {
    let sc = document.getElementById('settingScheme').value; if(!sc) return;
    snaBanksMap[sc] = { name: document.getElementById('settingBankName').value.trim(), ifsc: document.getElementById('settingIfsc').value.trim(), accNo: document.getElementById('settingAccNo').value.trim() };
    localStorage.setItem('pmShriBanks_' + currentSchool.udise, JSON.stringify(snaBanksMap)); Toast.fire({icon: 'success', title: 'Bank Details Saved!'});
}

function changeGlobalScheme() { globalScheme = document.getElementById('globalSchemeSelector').value; loadLedgerForDashboard(); }

function verifyLogin() {
    const udiseInput = document.getElementById('loginUdise').value.trim();
    const pinInput = document.getElementById('loginPin').value.trim();

    if(!udiseInput || !pinInput) {
        Swal.fire('Error', 'કૃપા કરીને UDISE અને 4-આંકડાનો PIN દાખલ કરો.', 'error');
        return;
    }

    const btn = document.getElementById('loginBtn');
    if(btn) { btn.innerHTML = `<i data-feather="loader" class="animate-spin w-4 h-4 inline"></i> Authenticating...`; btn.disabled = true; }
    if(typeof feather !== 'undefined') feather.replace();

    const scrambledPin = btoa(pinInput + "_SPARSH_SECURE");

    let savedAuthStr = localStorage.getItem("pmShriAuthData");
    if (savedAuthStr) {
        let authData = JSON.parse(savedAuthStr);
        let now = Date.now();
        let sevenDays = 7 * 24 * 60 * 60 * 1000;

        if (now - (authData.loginTimestamp || 0) < sevenDays && authData.udise === udiseInput) {
            if (authData.securePin && authData.securePin === scrambledPin) {
                console.log("✅ [SMART LOGIN] Local Secure PIN Matched! (0 Server Calls)");
                resumeWorkspace(authData); 
                return;
            }
        }
    }

    console.log("🌐 [SERVER LOGIN] સર્વર પાસે પાસવર્ડ ચેક કરવા મોકલી રહ્યા છીએ...");
    google.script.run
        .withFailureHandler(err => {
            let errorEl = document.getElementById('loginError');
            if(errorEl) { errorEl.innerText = err.message; errorEl.style.display = 'block'; }
            if(btn) { btn.innerHTML = 'Login to Workspace <i data-feather="arrow-right"></i>'; btn.disabled = false; }
        })
        .withSuccessHandler(res => {
            if(res && res.success) {
                localStorage.setItem("pmShriUdise", res.udise);
                let authPayload = { 
                    udise: res.udise, securePin: scrambledPin, name: res.name, schemeType: res.schemeType,
                    taluka: res.taluka, district: res.district, planType: res.planType, token: res.authToken, loginTimestamp: Date.now() 
                };
                localStorage.setItem("pmShriAuthData", JSON.stringify(authPayload)); 
                resumeWorkspace(authPayload);
            } else {
                let errorEl = document.getElementById('loginError');
                if(errorEl) { errorEl.innerText = res ? res.message : "Login Failed"; errorEl.style.display = 'block'; }
                if(btn) { btn.innerHTML = 'Login to Workspace <i data-feather="arrow-right"></i>'; btn.disabled = false;}
            }
        }).validateSchoolLogin(String(udiseInput), String(pinInput)); 
}

function resumeWorkspace(authData) {
    currentSchool = { udise: authData.udise, name: authData.name, schemeType: authData.schemeType, taluka: authData.taluka, district: authData.district, state: authData.state };
    let nameEl = document.getElementById('uiSchoolName'); if(nameEl) nameEl.innerText = authData.name; 
    let udiseEl = document.getElementById('uiUdise'); if(udiseEl) udiseEl.innerText = authData.udise;

    let userPlan = String(authData.planType || "COMBO").toUpperCase().replace(/[\s_]/g, '');
    let userSchemes = String(authData.schemeType || "").toUpperCase().replace(/[\s_]/g, '');
    let isDemo = userPlan.includes("DEMO") || userPlan.includes("₹0");
    let isAllInOne = userPlan.includes("ALLINONE");
    
    let isSnaAllowed = userPlan.includes("COMBO") || userPlan.includes("PMSHRI") || userPlan.includes("SSA") || isAllInOne || isDemo || userSchemes.includes("GJ302") || userSchemes.includes("GJ209");
    let isLocalAllowed = userPlan.includes("COMBO") || userPlan.includes("LOCAL") || isAllInOne || isDemo || userSchemes.includes("LOCAL");

    if (!isSnaAllowed) {
        Swal.fire({icon: 'error', title: 'Access Denied', text: 'તમારો પ્લાન SNA SPARSH માટે એક્ટિવ નથી. કૃપા કરીને પ્લાન અપગ્રેડ કરો.', allowOutsideClick: false, showConfirmButton: false});
        return;
    }

    let badgeContainer = document.getElementById('planDisplayBadge');
    if (badgeContainer) {
        if (isDemo) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase ml-3 animate-pulse">⏳ 3-DAY DEMO</span>`;
        else if (isAllInOne) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase ml-3">⭐ ALL IN ONE PRO</span>`;
    }

    let btnSwitch = document.querySelector('button[onclick="switchToLocalFund()"]');
    if (btnSwitch) {
        btnSwitch.style.display = isLocalAllowed ? 'flex' : 'none';
    }

    let overlay = document.getElementById('authOverlay'); if(overlay) overlay.style.display = 'none'; 
    let shell = document.getElementById('appShell'); if(shell) shell.style.display = 'flex';        
    if(typeof loadGujaratiNames === 'function') loadGujaratiNames(); 
    if(typeof initSchemes === 'function') initSchemes(); 
    if(typeof loadWizardDraft === 'function') loadWizardDraft(); 
    if(typeof loadLogoSettings === 'function') loadLogoSettings(); 
    if(typeof syncSchoolTemplateConfig === 'function') syncSchoolTemplateConfig();
    if(typeof loadFinancialYears === 'function') loadFinancialYears(); 
    
    let savedDashboard = window.lastDashboardRes || JSON.parse(localStorage.getItem('pmShriDash_' + authData.udise));
    if (savedDashboard && typeof renderDashboardUI === 'function') renderDashboardUI(savedDashboard);
    
    if(typeof loadVendorsData === 'function') loadVendorsData(false);
    if(typeof loadComponentsData === 'function') loadComponentsData();
    if(typeof loadDocs === 'function') loadDocs(false);
    
    silentBackgroundSync(authData.udise);

    let btn = document.getElementById('loginBtn');
    if(btn) { btn.innerHTML = 'Login to Workspace <i data-feather="arrow-right"></i>'; btn.disabled = false; }
    
    setTimeout(() => {
        if(typeof window.startSmartTutorial === 'function') {
            window.startSmartTutorial(false);
        }
    }, 2000);
}

function syncSchoolTemplateConfig() {
    let cacheKey = 'pmShriTemplates_' + currentSchool.udise;
    let versionKey = 'pmShriTemplatesVersion_' + currentSchool.udise;
    let localConfigStr = localStorage.getItem(cacheKey);
    let localVersion = localStorage.getItem(versionKey) || "0"; 

    let savedGuj = JSON.parse(localStorage.getItem('pmShriGujNames_' + currentSchool.udise) || "{}");
    let schoolDistrict = savedGuj.district || currentSchool.district || "KHEDA"; 

    fetch("https://raw.githubusercontent.com/smartschoolbotin/sna-sparsh-data/main/master_config.json?t=" + Date.now())
        .then(res => res.json())
        .then(masterData => {
            let serverVersion = (masterData.rules && masterData.rules.templateVersion) ? String(masterData.rules.templateVersion) : "1";
            
            if (true) { 
                let allTemplates = masterData.templates || [];
                let districtTemplates = allTemplates.filter(t => !t.district || t.district === "ALL" || t.district === schoolDistrict);

                localStorage.setItem(cacheKey, JSON.stringify(districtTemplates));
                localStorage.setItem(versionKey, serverVersion);
                
                console.log("System Updated to Version: v" + serverVersion);
                
                if (typeof Swal !== 'undefined') {
                    let tplCount = districtTemplates.length;
                    let districtName = schoolDistrict !== "ALL" ? schoolDistrict : "તમામ";
                    Swal.fire({
                        title: `સિસ્ટમ અપડેટ (v${serverVersion})`,
                        html: `<b>${districtName}</b> જિલ્લાના <b>${tplCount}</b> નવા ટેમ્પલેટ્સ સફળતાપૂર્વક સિંક થઈ ગયા છે.`, 
                        icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 6000, timerProgressBar: true
                    });
                }
            } else {
                console.log("Templates are up to date. Current Version: v" + localVersion);
            }
        })
        .catch(err => console.error("GitHub Template Fetch Error:", err));

    return localConfigStr ? JSON.parse(localConfigStr) : {};
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el => el.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition hover:bg-slate-800 hover:text-white font-medium text-slate-300");
    
    const dtBtn = document.getElementById('dt-' + tabId);
    if(dtBtn) {
        dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-indigo-600 shadow-md";
        if(tabId === 'accounting' || tabId === 'settings' || tabId === 'vendors' || tabId === 'database') {
            dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-slate-800 shadow-md mt-4 border-t border-slate-800 pt-4";
            if(tabId === 'accounting') dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-amber-500 shadow-md mt-4 border-t border-slate-800 pt-4";
            if(tabId === 'database') dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-sky-500 shadow-md mt-4 border-t border-slate-800 pt-4";
            
        }
    }
    
    document.querySelectorAll('.mobile-nav-btn').forEach(el => { 
        el.classList.remove('text-indigo-600', 'text-amber-500', 'text-sky-500', 'text-emerald-600'); 
        el.classList.add('text-slate-400'); 
    });
    const mbBtn = document.getElementById('mb-' + tabId);
    if(mbBtn) { 
        mbBtn.classList.remove('text-slate-400'); 
        if(tabId === 'accounting') mbBtn.classList.add('text-amber-500'); 
        else if(tabId === 'database') mbBtn.classList.add('text-sky-500');
        else if(tabId === 'registers') mbBtn.classList.add('text-emerald-600');
        else mbBtn.classList.add('text-indigo-600'); 
    }
    
    if(tabId === 'accounting') { setTimeout(() => { generateAccountingReport(); }, 100); }
    if(tabId === 'database') { setTimeout(() => { showDatabaseView('epayment'); }, 100); }
    if(tabId === 'voucher') { setTimeout(() => { loadSavedVouchers(); }, 100); }
    if(tabId === 'reports') { setTimeout(() => { loadDocs(); }, 100); }
    if(tabId === 'registers') { setTimeout(() => { loadOfficeRegistersData(); }, 100); }
    window.scrollTo(0, 0);
}

function autoMatchClaimFromPFMS() {
    let vRows = document.querySelectorAll('#previewVendorTableBody tr');
    if(vRows.length === 0) return Swal.fire('Oops', 'Please add vendors and amount first in Step 1.', 'warning');

    let currentVendorNames = Array.from(vRows).map(row => {
        let nameEl = row.querySelector('.v-name');
        return nameEl ? nameEl.innerText.trim().toLowerCase() : "";
    });

    let totalVal = parseFloat(document.getElementById('previewTotal').innerText.replace(/,/g, '')) || 0;
    let grandTotalC = Math.round(totalVal * 0.60);
    let grandTotalS = totalVal - grandTotalC;

    let foundC = "", foundS = "";
    let btn = document.querySelector('button[onclick="autoMatchClaimFromPFMS()"]');
    let origText = btn.innerHTML;
    btn.innerHTML = '<i data-feather="loader" class="animate-spin w-4 h-4 inline"></i> શોધાય છે...';
    if(typeof feather !== 'undefined') feather.replace();

    setTimeout(() => {
        let usedClaims = new Set();
        if (typeof rawMtlData !== 'undefined' && rawMtlData.length > 0) {
            rawMtlData.forEach(m => {
                let keys = Object.keys(m);
                let claimKey = keys.find(k => k.toUpperCase().includes('CLAIM'));
                let rawClaim = String(m[claimKey] || "").trim().toUpperCase();
                
                if (rawClaim && rawClaim !== "-" && rawClaim !== "PENDING" && rawClaim !== "MANUAL-ENTRY") {
                    rawClaim.split('/').forEach(c => usedClaims.add(c.trim().replace(/[^A-Z0-9]/g, '')));
                }
            });
        }

        const checkAndAssign = (epAmt, epClaim) => {
            if (epClaim && !usedClaims.has(epClaim)) {
                if ((Math.abs(epAmt - grandTotalC) <= 2 || Math.abs(epAmt - totalVal) <= 2) && !foundC) {
                    foundC = epClaim;
                }
                if (Math.abs(epAmt - grandTotalS) <= 2 && !foundS) {
                    foundS = epClaim;
                }
            }
        };

        if (typeof rawClaimsData !== 'undefined' && rawClaimsData.length > 0) {
            rawClaimsData.forEach(c => {
                let keys = Object.keys(c);
                let amtKey = keys.find(k => k.toUpperCase().includes('GROSS') || k.toUpperCase().includes('AMOUNT'));
                let claimKey = keys.find(k => k.toUpperCase().includes('CLAIM NO') || k.toUpperCase() === 'CLAIM_NO');

                let cAmt = amtKey ? parseFloat(String(c[amtKey] || "0").replace(/,/g, '')) : 0;
                let cClaim = claimKey ? String(c[claimKey]).toUpperCase().replace(/[^A-Z0-9]/g, '') : "";

                checkAndAssign(cAmt, cClaim);
            });
        }

        if (typeof rawEpayData !== 'undefined' && rawEpayData.length > 0) {
            rawEpayData.forEach(ep => {
                let keys = Object.keys(ep);
                let netKey = keys.find(k => k.toUpperCase().includes('NET') || k.toUpperCase().includes('AMOUNT'));
                let claimKey = keys.find(k => k.toUpperCase().includes('CLAIM') || k.toUpperCase().includes('PPA'));
                let vendorKey = keys.find(k => k.toUpperCase().includes('BENEFICIARY') || k.toUpperCase().includes('VENDOR') || k.toUpperCase().includes('NAME'));
                
                let epAmt = netKey ? parseFloat(String(ep[netKey] || "0").replace(/,/g, '')) : 0;
                let epClaim = claimKey ? String(ep[claimKey]).toUpperCase().replace(/[^A-Z0-9]/g, '') : "";
                let epVendor = vendorKey ? String(ep[vendorKey]).trim().toLowerCase() : "";
                
                let isVendorMatch = currentVendorNames.some(vName => epVendor.includes(vName) || vName.includes(epVendor));

                if (isVendorMatch || !epVendor) {
                    checkAndAssign(epAmt, epClaim);
                }
            });
        }

        btn.innerHTML = origText; if(typeof feather !== 'undefined') feather.replace();

        if (foundC || foundS) {
            document.getElementById('centralClaimNo').value = foundC; 
            document.getElementById('stateClaimNo').value = foundS;
            Toast.fire({ icon: 'success', title: 'નવો ફ્રેશ Claim નંબર મળી ગયો!' });
        } else {
            Swal.fire('No Match Found', `SNA SPARSH માં નવો / વણવપરાયેલ ક્લેઈમ મળ્યો નથી. (જે ક્લેઈમ છે તે અગાઉ વપરાઈ ગયા છે).`, 'info');
        }
    }, 500);
}

function downloadDatabaseExcel() {
    let activeBtn = document.querySelector('[id^="btn-db-"].bg-sky-500');
    if(!activeBtn) return;
    let type = activeBtn.id.replace('btn-db-', '');
    
    let data = [];
    if(type === 'epayment') data = rawEpayData || [];
    else if(type === 'claims') data = rawClaimsData || [];
    else if(type === 'mtl') data = rawMtlData || [];
    else if(type === 'sanctions') data = (window.lastDashboardRes && window.lastDashboardRes.motherSanctions) ? window.lastDashboardRes.motherSanctions : [];
    else if(type === 'vendors') data = globalVendorsFull || [];
    
    if(!data || data.length === 0) return Swal.fire('Oops', 'No data to download', 'warning');
    
    let ws = XLSX.utils.json_to_sheet(data);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    XLSX.writeFile(wb, `SNA_Portal_${type}_${new Date().getTime()}.xlsx`);
}

function showDatabaseView(type) {
    let btns = ['epayment', 'claims', 'sanctions', 'vendors', 'mtl'];
    
    btns.forEach(b => {
        let el = document.getElementById('btn-db-' + b);
        if(el) el.className = "px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition whitespace-nowrap";
    });

    let activeBtn = document.getElementById('btn-db-' + type);
    if(activeBtn) activeBtn.className = "px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 text-white shadow-sm transition whitespace-nowrap";

    let data = [];
    if(type === 'epayment') data = rawEpayData || [];
    else if(type === 'claims') data = rawClaimsData || [];
    else if(type === 'mtl') data = rawMtlData || [];
    else if(type === 'sanctions') data = (window.lastDashboardRes && window.lastDashboardRes.motherSanctions) ? window.lastDashboardRes.motherSanctions : [];
    else if(type === 'vendors') data = globalVendorsFull || [];

    let thead = document.getElementById('dbThead'); let tbody = document.getElementById('dbTbody');
    if(!thead || !tbody) return;

    if(!data || data.length === 0) { 
        thead.innerHTML = ""; 
        tbody.innerHTML = "<tr><td class='p-10 text-center font-bold text-slate-400'>No Data Available.</td></tr>"; 
        return; 
    }

    let headers = Object.keys(data[0]); 
    let thHtml = "<tr>";
    headers.forEach(h => { thHtml += `<th class="p-3 border-b border-slate-200 bg-slate-50">${escapeHtml(h)}</th>`; }); 
    thHtml += "</tr>"; 
    thead.innerHTML = thHtml;
    
    let tbHtml = "";
    data.forEach(row => { 
        tbHtml += "<tr class='hover:bg-slate-50 transition border-b border-slate-100'>"; 
        headers.forEach(h => { 
            let cellValue = row[h];
            let displayValue = (cellValue === null || cellValue === undefined) ? "-" : cellValue;
            tbHtml += `<td class="p-3 text-xs text-slate-700">${escapeHtml(displayValue)}</td>`; 
        }); 
        tbHtml += "</tr>"; 
    });
    tbody.innerHTML = tbHtml;
}

function toggleAllMonths(source) { document.querySelectorAll('.month-chk').forEach(chk => { chk.checked = source.checked; }); updateMonthSelection(); }
function updateMonthSelection() {
    let chks = document.querySelectorAll('#monthFilterChips .month-chk'); let allChecked = true;
    chks.forEach(chk => { if(!chk.checked) allChecked = false; });
    let selAll = document.getElementById('selectAllMonths'); if(selAll) selAll.checked = allChecked;
    let tab = document.getElementById('tab-accounting');
    if(tab && tab.classList.contains('active')) generateAccountingReport();
}

function loadVendorsData(forceRefresh = false) {
    let cachedData = localStorage.getItem('pmShriVendors_' + currentSchool.udise);
    
    if (cachedData && !forceRefresh) {
        let vRes = JSON.parse(cachedData);
        dynamicVendorsList = vRes.list || []; globalVendorsFull = vRes.fullData || [];
        updateGlobalOptions();
        refreshAllVendorDropdowns();
        renderVendorPage(1, "");
        return; 
    }

    google.script.run.withFailureHandler(err => console.error(err)).withSuccessHandler(vRes => {
        localStorage.setItem('pmShriVendors_' + currentSchool.udise, JSON.stringify(vRes));
        dynamicVendorsList = vRes.list || []; globalVendorsFull = vRes.fullData || [];
        updateGlobalOptions();
        refreshAllVendorDropdowns();
        renderVendorPage(1, "");
    }).getVendorList(String(currentSchool.udise)); 
}

function renderVendorPage(page, searchQuery = "") {
    vendorPage = page; let filtered = globalVendorsFull.filter(v => (v.name||"").toLowerCase().includes(searchQuery.toLowerCase()) || (v.accNo||"").includes(searchQuery));
    let totalPages = Math.ceil(filtered.length / VENDORS_PER_PAGE) || 1; if(vendorPage > totalPages) vendorPage = totalPages;
    let start = (vendorPage - 1) * VENDORS_PER_PAGE; let paged = filtered.slice(start, start + VENDORS_PER_PAGE);

    const grid = document.getElementById('dynamicVendorGrid'); if(!grid) return; grid.innerHTML = '';
    if(paged.length === 0) { grid.innerHTML = '<div class="col-span-full text-center py-10 font-bold text-slate-400">કોઈ વેન્ડર જોવા મળ્યા નથી.</div>'; } 
    else { paged.forEach(v => { grid.innerHTML += `<div class="glass-card p-5 rounded-2xl border-l-4 border-emerald-500 relative transition hover:shadow-md"><div class="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg">${escapeHtml(v.status || 'ACTIVE')}</div><h3 class="font-bold text-slate-800 truncate pr-10">${escapeHtml(v.name)}</h3><p class="text-[10px] text-slate-500 mb-3 font-semibold">${escapeHtml(v.type)}</p><div class="text-xs text-slate-600 space-y-1"><p><b>A/C:</b> ${escapeHtml(v.accNo)}</p><p><b>IFSC:</b> ${escapeHtml(v.ifsc)}</p></div></div>`; }); }
    let pContainer = document.getElementById('vendorPagination');
    if(pContainer) { pContainer.innerHTML = ""; for(let i=1; i<=totalPages; i++) { pContainer.innerHTML += `<button onclick="renderVendorPage(${i}, '${escapeHtml(searchQuery)}')" class="page-btn ${i === vendorPage ? 'active' : ''}">${i}</button>`; } }
}

function loadComponentsData() { 
    console.log("🚀 [GITHUB API] loadComponentsData શરૂ થયું. ડેટા સીધો GitHub થી મંગાવી રહ્યા છીએ...");
    let cacheKey = 'pmShriComps_' + currentSchool.udise;
    let cached = localStorage.getItem(cacheKey);
    
    if (cached && cached !== "[]") {
        console.log("📦 [CACHE] Cache માંથી ડેટા મળ્યો. લંબાઈ:", JSON.parse(cached).length);
        processComponentsData(JSON.parse(cached));
    }

    let slsCodeEl = document.getElementById('wizardSlsCode');
    let slsCode = slsCodeEl ? slsCodeEl.value : "GJ302"; 

    fetch("https://cdn.jsdelivr.net/gh/smartschoolbotin/sna-sparsh-data@main/master_config.json")
        .then(res => res.json())
        .then(masterData => {
            let allComps = masterData.components || [];
            let cRes = allComps.filter(c => !c.schemeCode || c.schemeCode === "ALL" || c.schemeCode === slsCode);
            
            if (cRes && cRes.length > 0) {
                console.log(`✅ [GITHUB API] ${cRes.length} Components મળ્યા! Cache સેવ કરી રહ્યા છીએ.`);
                localStorage.setItem(cacheKey, JSON.stringify(cRes));
                processComponentsData(cRes); 
            }
        })
        .catch(err => console.error("GitHub Components Fetch Error:", err));
}

function processComponentsData(data) {
    console.log("⚙️ [PROCESS 3] processComponentsData શરૂ થયું. ડેટાની લંબાઈ:", data ? data.length : 0);
    dynamicComps = data || [];
    
    localStorage.removeItem('pmShriCustomHeadsMap_' + currentSchool.udise);
    customHeadsMap = {}; 

    dynamicComps.forEach(c => {
        let enRaw = c.nameEn || c.NAME_EN || c.name_en || "";
        let guRaw = c.nameGu || c.NAME_GU || c.name_gu || "";
        let codeRaw = c.code || c.CODE || "";

        let en = String(enRaw).trim();
        let gu = String(guRaw).trim();

        if (en && en.toUpperCase() !== "NAME_EN" && en !== "-") {
            customHeadsMap[en] = gu;
            if (codeRaw) {
                customHeadsMap[String(codeRaw).trim()] = gu;
            }
        }
    });
    console.log("⚙️ [PROCESS 3] customHeadsMap બની ગયો. ટોટલ આઇટમ્સ:", Object.keys(customHeadsMap).length);

    updateGlobalOptions(); 
    
    setTimeout(() => {
        console.log("⏱️ [PROCESS 3] Timeout પૂરું થયું, refreshAllHeadDropdowns કોલ થાય છે.");
        if (typeof refreshAllHeadDropdowns === 'function') {
            refreshAllHeadDropdowns();
        }
    }, 300);
}

async function loadLedgerForDashboard(forceRefresh = false) {
    const dBody = document.getElementById('dashTxnTableBody');
    let cachedDash = await localforage.getItem('pmShriDash_' + currentSchool.udise);
    if (!cachedDash) {
        cachedDash = localStorage.getItem('pmShriDash_' + currentSchool.udise);
        if(cachedDash) localforage.setItem('pmShriDash_' + currentSchool.udise, cachedDash);
    }
    let hasCache = false;

    if (cachedDash && !forceRefresh) {
        try {
            let res = JSON.parse(cachedDash);
            renderDashboardUI(res); 
            hasCache = true;
        } catch(e) {}
    } else {
        if(dBody) dBody.innerHTML = window.getSkeletonHTML();
    }

    if (hasCache && !forceRefresh) {
         let titleEl = document.getElementById('uiSchoolName');
         if(titleEl && !titleEl.innerHTML.includes('syncIndicator')) {
             titleEl.innerHTML += ` <span id="syncIndicator" class="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full animate-pulse align-middle ml-2 border border-emerald-200 inline-flex items-center gap-1"><i data-feather="refresh-cw" class="w-3 h-3"></i> Syncing...</span>`;
             if(typeof feather !== 'undefined') feather.replace();
         }
    }

    google.script.run
    .withFailureHandler(err => { 
        console.error("Live Sync Failed:", err);
        let syncInd = document.getElementById('syncIndicator');
        if(syncInd) syncInd.remove();
    })
    .withSuccessHandler(res => {
        let syncInd = document.getElementById('syncIndicator');
        if(syncInd) syncInd.remove();

        if(res && res.success) {
            let newStr = JSON.stringify(res);
            if (newStr !== cachedDash || forceRefresh) {
                localforage.setItem('pmShriDash_' + currentSchool.udise, newStr); 
                localStorage.removeItem('pmShriDash_' + currentSchool.udise); 
                renderDashboardUI(res);
                
                if (hasCache && !forceRefresh && typeof Toast !== 'undefined') {
                    Toast.fire({
                        icon: 'info',
                        title: 'SNA SPARSH પોર્ટલનો નવો ડેટા સિંક થઈ ગયો છે!',
                        timer: 3000
                    });
                }
            }
        } else if (res && !res.success && forceRefresh) { 
            Swal.fire('Data Error', res.message, 'error'); 
        }
    }).fetchDashboardDataPRO(String(currentSchool.udise)); 
}

function findDynamicColumn(headersArray, regexPatterns) {
    if (!regexPatterns || regexPatterns.length === 0) return null;
    for (let pattern of regexPatterns) {
        let regex = new RegExp(pattern, "i");
        let matchedHeader = headersArray.find(h => regex.test(String(h).trim()));
        if (matchedHeader) return matchedHeader;
    }
    return null;
}

async function renderDashboardUI(res) {
    if (res) window.lastDashboardRes = res; 
    else res = window.lastDashboardRes;
    if (!res) return;

    rawEpayData = res.epayments || []; 
    rawMtlData = res.mtl || []; 
    rawClaimsData = res.claims || []; 
    let msData = res.motherSanctions || [];
    
    let targetUdise = String(currentSchool.udise || "").replace(/[^0-9]/g, '');
    let filterVal = document.getElementById('dashFundFilter') ? document.getElementById('dashFundFilter').value : "ALL";
    
    let msRules;
    let defaultRules = {
        "1_semantic_column_discovery": {
            "identifier_patterns": ["Mother Sanction.*", "SANCTION.*NO"],
            "grant_addition_patterns": ["EFFECTIVE.*DISTRIBUTED", "TOP[-_ ]UP.*AMOUNT", "^TOTAL AMOUNT$"],
            "grant_subtraction_patterns": ["UTILIZED", "CLAIM.*CREATED", "SPENT"],
            "revoke_patterns": ["REVOKE", "WITHDRAWN", "LAPSE"]
        },
        "2_auto_lapse_triggers": { "lapse_if_revoke_greater_than_zero": true },
        "3_targeted_kill_switches": []
    };

    try {
        let configRes = await fetch("https://raw.githubusercontent.com/smartschoolbotin/sna-sparsh-data/main/master_config.json?t=" + Date.now());
        let configData = await configRes.json();
        msRules = (configData.rules && configData.rules.motherSanctionRules) ? configData.rules.motherSanctionRules : defaultRules;
        localStorage.setItem("LAST_GOOD_MS_RULES", JSON.stringify(msRules));
    } catch (e) {
        console.warn("GitHub Rules fetch failed, using memory fallback.");
        let saved = localStorage.getItem("LAST_GOOD_MS_RULES");
        msRules = saved ? JSON.parse(saved) : defaultRules;
    }

    let rawHeaders = msData.length > 0 ? Object.keys(msData[0]) : [];
    let colId = findDynamicColumn(rawHeaders, msRules["1_semantic_column_discovery"].identifier_patterns) || "Mother Sanction No.";
    let colAdd = findDynamicColumn(rawHeaders, msRules["1_semantic_column_discovery"].grant_addition_patterns) || "EFFECTIVE DISTRIBUTED AMOUNT";
    let colSub = findDynamicColumn(rawHeaders, msRules["1_semantic_column_discovery"].grant_subtraction_patterns) || "TOTAL AMOUNT (CLAIM CREATED)";
    let colRevoke = findDynamicColumn(rawHeaders, msRules["1_semantic_column_discovery"].revoke_patterns) || "REVOKE AMOUNT";

    let tGrant = 0; 
    let tPortalOfficial = 0; 
    let recurringAmt = 0;
    let nonRecurringAmt = 0;

    let sanctionWallets = {}; 

    let activeSanctionsList = [];
    msData.forEach(ms => {
        let keys = Object.keys(ms);
        let idKey = keys.find(k => String(k).toUpperCase().replace(/[^A-Z]/g, '').includes("MOTHERSANCTION"));
        let sNo = idKey ? String(ms[idKey]).trim() : "Unknown";
        if(sNo !== "Unknown" && !activeSanctionsList.includes(sNo)) activeSanctionsList.push(sNo);
    });
    
    let isMultipleSanctions = activeSanctionsList.length > 1;
    let msOverrides = JSON.parse(localStorage.getItem('pmShriMsStatus_' + targetUdise)) || {};

    msData.forEach(ms => {
        let keys = Object.keys(ms);
        let idKey = keys.find(k => String(k).toUpperCase().replace(/[^A-Z]/g, '').includes("MOTHERSANCTION"));
        let sanctionNo = idKey ? String(ms[idKey]).trim() : "Unknown";
        
        let grantAmt = 0, usedAmt = 0, availAmt = 0, revokeAmt = 0;
        keys.forEach(k => {
            let upperK = String(k).toUpperCase().replace(/[^A-Z]/g, '');
            if (upperK.includes("EFFECTIVEDISTRIBUTED") || upperK.includes("DISTRIBUTEDAMOUNT")) {
                grantAmt = parseFloat(String(ms[k]).replace(/[^0-9.-]/g, '')) || 0;
            } else if (grantAmt === 0 && upperK.includes("TOPUP")) {
                grantAmt = parseFloat(String(ms[k]).replace(/[^0-9.-]/g, '')) || 0;
            }
            
            if (upperK.includes("TOTALAMOUNTCLAIM") || upperK.includes("CLAIMCREATED") || upperK.includes("UTILIZED")) {
                usedAmt = parseFloat(String(ms[k]).replace(/[^0-9.-]/g, '')) || 0;
            }
            if (upperK.includes("AVAILABLEAMOUNT") || upperK.includes("BALANCE")) {
                availAmt = parseFloat(String(ms[k]).replace(/[^0-9.-]/g, '')) || 0;
            }
            if (upperK.includes("REVOKE")) {
                revokeAmt = parseFloat(String(ms[k]).replace(/[^0-9.-]/g, '')) || 0;
            }
        });

        let isAutoLapsed = false;
        if (revokeAmt > 0) isAutoLapsed = true;
        if (isMultipleSanctions && (sanctionNo.startsWith("001/") || sanctionNo.includes("001/2026"))) {
            isAutoLapsed = true; 
        }

        let statusStr = String(ms['Status'] || ms['STATUS'] || "").toUpperCase().trim();
        let finalStatus = (isAutoLapsed || statusStr === "INACTIVE") ? "INACTIVE" : "ACTIVE";

        let msOverrides = JSON.parse(localStorage.getItem('pmShriMsStatus_' + targetUdise)) || {};
        if (msOverrides[sanctionNo]) {
            finalStatus = msOverrides[sanctionNo];
        }

        let hoaStr = String(ms['HOA'] || "").trim().toUpperCase();
        let objClassStr = String(ms['Object Class'] || ms['OBJECT CLASS'] || "").toUpperCase();
        let isCapital = hoaStr.startsWith("4") || hoaStr.startsWith("6") || objClassStr.includes("CAPITAL");
        let msType = isCapital ? "NON RECURRING" : "RECURRING";

        let walletKey = sanctionNo + "_" + msType;

        if (!sanctionWallets[walletKey]) {
            sanctionWallets[walletKey] = { 
                sanctionNo: sanctionNo,
                msType: msType,
                totalGrant: 0, 
                totalUsed: 0, 
                totalAvail: 0,
                status: finalStatus
            };
        }

        if(finalStatus === "INACTIVE") sanctionWallets[walletKey].status = "INACTIVE";

        sanctionWallets[walletKey].totalGrant += grantAmt;
        sanctionWallets[walletKey].totalUsed += usedAmt;
        sanctionWallets[walletKey].totalAvail += availAmt;
    });

    let hoaHtml = ""; 

    let sortedWallets = Object.values(sanctionWallets).sort((a, b) => {
        if (a.status === "ACTIVE" && b.status === "INACTIVE") return -1;
        if (a.status === "INACTIVE" && b.status === "ACTIVE") return 1;
        return b.totalGrant - a.totalGrant; 
    });

    for (let wallet of sortedWallets) {
        let trueGrantContributed = wallet.totalGrant;
        
        if (wallet.status === "INACTIVE") {
            trueGrantContributed = wallet.totalGrant - wallet.totalAvail; 
            if (trueGrantContributed < 0) trueGrantContributed = 0;
        }

        if (wallet.msType === "NON RECURRING") nonRecurringAmt += trueGrantContributed;
        else recurringAmt += trueGrantContributed;

        if (filterVal === "ALL" || filterVal === wallet.msType) {
            tGrant += trueGrantContributed;
            tPortalOfficial += wallet.totalUsed;

            if (trueGrantContributed > 0) {
                let badgeColor = wallet.status === "INACTIVE" ? "bg-rose-500/40 text-rose-100 border-rose-500/50" : "bg-emerald-500/40 text-emerald-100 border-emerald-500/50";
                let shortSNo = wallet.sanctionNo.length > 22 ? wallet.sanctionNo.substring(0, 22) + '...' : wallet.sanctionNo;
                let typeLabel = wallet.msType === 'RECURRING' ? 'મહેસૂલી (Recurring)' : 'મૂડી (Non-Recurring)';
                
                let cardStyle = wallet.status === "INACTIVE" ? "opacity-75 grayscale-[20%]" : "opacity-100";
                let isChecked = wallet.status === "ACTIVE" ? "checked" : "";
                
                hoaHtml += `
                <div class="bg-black/20 p-3 rounded-xl border border-white/10 shrink-0 shadow-inner transition-all ${cardStyle}">
                    <p class="text-[10px] text-indigo-100 font-bold mb-1 flex justify-between items-center gap-2">
                        <span class="truncate" title="${wallet.sanctionNo}"><i data-feather="file-text" class="w-3 h-3 inline pb-0.5"></i> ${shortSNo}</span>
                        
                        <div class="flex items-center gap-1.5 shrink-0 z-20">
                            <label class="relative inline-flex items-center cursor-pointer" title="Turn ON/OFF">
                              <input type="checkbox" class="sr-only peer" ${isChecked} onchange="toggleSanctionStatus('${wallet.sanctionNo}', this.checked)">
                              <div class="w-6 h-3.5 bg-rose-500/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-2.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-emerald-500/80 border border-white/30"></div>
                            </label>
                            <span class="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${badgeColor}">${wallet.status}</span>
                        </div>
                    </p>                        <div class="flex justify-between items-end">
                        <div>
                            <p class="text-[8px] text-indigo-200 uppercase tracking-widest mb-0.5">${typeLabel}</p>
                            <p class="text-base font-black text-white leading-none">₹ ${formatINR(trueGrantContributed)}</p>
                        </div>
                        <div class="text-[9px] text-indigo-200 font-bold text-right leading-tight bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            C(60%): <span class="text-white">₹${formatINR(trueGrantContributed * 0.60)}</span><br>
                            S(40%): <span class="text-white">₹${formatINR(trueGrantContributed * 0.40)}</span>
                        </div>
                    </div>
                </div>`;
            }
        }
    }

    let dHoa = document.getElementById('dynamicHoaBreakdown');
    if (dHoa) {
        dHoa.className = "mt-auto flex flex-col gap-2 relative z-10 flex-1 min-h-0 max-h-[220px] overflow-y-auto premium-scroll pr-1";
        if (hoaHtml === "") {
            dHoa.innerHTML = `<div class="text-center text-indigo-200 text-xs font-bold py-4 bg-black/10 rounded-xl border border-white/10">કોઈ સેન્ક્શન મળ્યા નથી</div>`;
        } else {
            dHoa.innerHTML = hoaHtml;
        }
    }

    let epayStatusMap = new Map(); 

    rawEpayData.forEach(ep => {
        let keys = Object.keys(ep);
        let uKey = keys.find(k => String(k).toUpperCase().includes('UDISE'));
        let rUdise = uKey ? String(ep[uKey] || "").replace(/[^0-9]/g, '') : "";
        if (targetUdise && rUdise && rUdise !== targetUdise) return;

        let claimKey = keys.find(k => String(k).toUpperCase().includes('CLAIM') || String(k).toUpperCase().includes('PPA'));
        let claim = String(ep[claimKey] || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        let statKey = keys.find(k => String(k).toUpperCase() === 'STATUS');
        let status = String(ep[statKey] || "").toUpperCase();
        
        let dateKey = keys.find(k => String(k).toUpperCase().includes('SETTLEMENT') || String(k).toUpperCase().includes('PASS'));
        let passDate = dateKey ? String(ep[dateKey] || "").trim() : "";
        
        if(passDate.includes(" ")) passDate = passDate.split(" ")[0]; 
        if(passDate.includes("-") && passDate.split("-")[0].length === 4) {
            let p = passDate.split("-");
            passDate = `${p[2]}-${p[1]}-${p[0]}`;
        }

        let unified = "PENDING";
        if (status.includes("SUCCESS") || status.includes("COMPLETED") || status.includes("PAID") || status.includes("MATCH")) unified = "SUCCESS";
        else if (status.includes("REJECT") || status.includes("FAIL") || status.includes("RETURN") || status.includes("CANCEL")) unified = "REJECTED";

        if (claim) epayStatusMap.set(claim, { status: unified, date: passDate });
    });

    let erpTotal = 0; 
    let erpCentralTotal = 0; 
    let erpStateTotal = 0;   
    let pfmsPassed = 0;
    let pfmsPending = 0;
    let pfmsRejected = 0;
    let headTotals = {}; 
    let monthTotals = {};
    let finalTableData = [];
    let uniqueMtlTracker = new Map();

    rawMtlData.forEach(m => {
        let keys = Object.keys(m);
        let uKey = keys.find(k => String(k).toUpperCase().includes('UDISE'));
        let rUdise = uKey ? String(m[uKey] || "").replace(/[^0-9]/g, '') : "";
        if (targetUdise && rUdise && rUdise !== targetUdise) return;

        let typeKey = keys.find(k => String(k).toUpperCase().includes('TXN_TYPE') || String(k).toUpperCase().includes('TXN TYPE'));
        let currentType = String(m[typeKey] || "RECURRING").toUpperCase();
        if (filterVal !== "ALL" && !currentType.includes(filterVal)) return;

        let amtKey = keys.find(k => String(k).toUpperCase() === 'AMOUNT');
        let amt = parseFloat(String(m[amtKey] || "0").replace(/,/g, '')) || 0;
        if (amt <= 0) return;

        let cenKey = keys.find(k => String(k).toUpperCase() === 'CENTRAL_SHARE' || String(k).toUpperCase() === 'CENTRAL SHARE');
        let stateKey = keys.find(k => String(k).toUpperCase() === 'STATE_SHARE' || String(k).toUpperCase() === 'STATE SHARE');
        
        let exactCen = cenKey ? parseFloat(String(m[cenKey] || "0").replace(/,/g, '')) : 0;
        let exactState = stateKey ? parseFloat(String(m[stateKey] || "0").replace(/,/g, '')) : 0;

        if (exactCen === 0 && exactState === 0 && amt > 0) {
            exactCen = Math.round(amt * 0.60);
            exactState = amt - exactCen;
        }

        let venKey = keys.find(k => String(k).toUpperCase().includes('VENDOR'));
        let vendor = m[venKey] || "";

        let claimKey = keys.find(k => String(k).toUpperCase().includes('CLAIM'));
        let rawClaim = String(m[claimKey] || "").trim();
        
        let dateKey = keys.find(k => String(k).toUpperCase() === 'DATE');
        let dateVal = m[dateKey] || "-";
        
        let headKey = keys.find(k => String(k).toUpperCase().includes('COMPONENT_NAME'));
        let head = m[headKey] || "SNA Grant";

        let uniqueKey = `${dateVal}_${vendor.replace(/\s+/g,'').toUpperCase()}_${rawClaim.replace(/\s+/g,'').toUpperCase()}_${amt}`;
        if (uniqueMtlTracker.has(uniqueKey)) return; 
        uniqueMtlTracker.set(uniqueKey, true);

        let claimParts = rawClaim.split('/');
        let claim60 = claimParts[0] ? claimParts[0].toUpperCase().replace(/[^A-Z0-9]/g, '') : "";
        let claim40 = claimParts[1] ? claimParts[1].toUpperCase().replace(/[^A-Z0-9]/g, '') : "";

        let epay60 = epayStatusMap.get(claim60) || { status: "PENDING", date: "-" };
        let epay40 = epayStatusMap.get(claim40) || { status: "PENDING", date: "-" };
        
        let pStat = "PENDING";
        let pDate = "-"; 
        if (epay60.status === "SUCCESS" || epay40.status === "SUCCESS") {
            pStat = "SUCCESS";
            pDate = (epay60.date && epay60.date !== "-") ? epay60.date : epay40.date;
        } else if (epay60.status === "REJECTED" || epay40.status === "REJECTED") pStat = "REJECTED";

        if (pStat === "REJECTED") {
            pfmsRejected += amt; 
        } else {
            erpTotal += amt;  
            erpCentralTotal += exactCen;   
            erpStateTotal += exactState;   
            
            if (pStat === "SUCCESS") pfmsPassed += amt;
            else pfmsPending += amt;
            
            if(!headTotals[head]) headTotals[head] = 0; 
            headTotals[head] += amt;
            
            let parts = String(dateVal).split('-'); 
            let mKey = "ALL";
            if(parts.length >= 2) { 
                let mStr = parts[1].toLowerCase(); 
                if(isNaN(mStr)) mKey = mStr.substring(0,3); 
                else { 
                    let mNum = parseInt(mStr, 10); 
                    const mNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]; 
                    if(mNum >= 1 && mNum <= 12) mKey = mNames[mNum - 1]; 
                } 
            }
            if(mKey !== "ALL") { 
                if(!monthTotals[mKey]) monthTotals[mKey] = 0; 
                monthTotals[mKey] += amt; 
            }
        }

        finalTableData.push({ 
            date: dateVal, 
            vendorName: vendor, 
            componentName: head, 
            claimNo: rawClaim, 
            amount: amt, 
            unifiedStatus: pStat,
            status: pStat === "SUCCESS" ? "Successful" : (pStat === "REJECTED" ? "Rejected" : "Pending"), 
            pfmsDate: pDate 
        });
    });

    let safeBalance = tGrant - erpTotal;
    if(safeBalance < 0) safeBalance = 0; 

    let grantCen = Math.round(tGrant * 0.60);
    let grantState = tGrant - grantCen;

    let balCen = grantCen - erpCentralTotal;
    let balState = grantState - erpStateTotal;
    
    if(balCen < 0) balCen = 0;
    if(balState < 0) balState = 0;

    const animateAmount = (element, endValue) => {
        if (!element) return;
        let startTimestamp = null;
        const duration = 1200;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = progress * (2 - progress) * endValue; 
            element.innerText = "₹ " + formatINR(currentVal);
            if (progress < 1) window.requestAnimationFrame(step);
            else element.innerText = "₹ " + formatINR(endValue);
        };
        window.requestAnimationFrame(step);
    };

    let eGrant = document.getElementById('dashGrant'); if(eGrant) animateAmount(eGrant, tGrant);
    
    let eErp = document.getElementById('dashErpTotal'); if(eErp) animateAmount(eErp, erpTotal);
    let eErpCen = document.getElementById('dashErpCentral'); if(eErpCen) animateAmount(eErpCen, erpCentralTotal);
    let eErpState = document.getElementById('dashErpState'); if(eErpState) animateAmount(eErpState, erpStateTotal);

    let eBal = document.getElementById('dashLiveBalance'); if(eBal) animateAmount(eBal, safeBalance);
    let eBalCen = document.getElementById('dashBalCentral'); if(eBalCen) animateAmount(eBalCen, balCen);
    let eBalState = document.getElementById('dashBalState'); if(eBalState) animateAmount(eBalState, balState);

    let pOfficial = document.getElementById('dashPortalOfficial'); if(pOfficial) animateAmount(pOfficial, tPortalOfficial);
    let pPassed = document.getElementById('dashPfmsPassed'); if(pPassed) animateAmount(pPassed, pfmsPassed);
    let pPending = document.getElementById('dashPfmsPending'); if(pPending) animateAmount(pPending, pfmsPending);
    let pReject = document.getElementById('dashPfmsRejected'); if(pReject) animateAmount(pReject, pfmsRejected);

    let pctErp = tGrant > 0 ? ((erpTotal / tGrant) * 100).toFixed(1) : 0;
    let pctBal = tGrant > 0 ? ((safeBalance / tGrant) * 100).toFixed(1) : 0;
    let pctOfficial = tGrant > 0 ? ((tPortalOfficial / tGrant) * 100).toFixed(1) : 0;
    let pctPassed = erpTotal > 0 ? ((pfmsPassed / erpTotal) * 100).toFixed(1) : 0;
    let pctPending = erpTotal > 0 ? ((pfmsPending / erpTotal) * 100).toFixed(1) : 0;
    let pctRejected = tGrant > 0 ? ((pfmsRejected / tGrant) * 100).toFixed(1) : 0;

    if(document.getElementById('barErp')) document.getElementById('barErp').style.width = Math.min(pctErp, 100) + '%';
    if(document.getElementById('pctErp')) document.getElementById('pctErp').innerText = pctErp;
    
    if(document.getElementById('barBal')) document.getElementById('barBal').style.width = Math.min(pctBal, 100) + '%';
    if(document.getElementById('pctBal')) document.getElementById('pctBal').innerText = pctBal;

    if(document.getElementById('barOfficial')) document.getElementById('barOfficial').style.width = Math.min(pctOfficial, 100) + '%';
    if(document.getElementById('pctOfficial')) document.getElementById('pctOfficial').innerText = pctOfficial;

    if(document.getElementById('barPassed')) document.getElementById('barPassed').style.width = Math.min(pctPassed, 100) + '%';
    if(document.getElementById('pctPassed')) document.getElementById('pctPassed').innerText = pctPassed; 

    if(document.getElementById('barPending')) document.getElementById('barPending').style.width = Math.min(pctPending, 100) + '%';
    if(document.getElementById('pctPending')) document.getElementById('pctPending').innerText = pctPending;

    if(document.getElementById('barRejected')) document.getElementById('barRejected').style.width = Math.min(pctRejected, 100) + '%';
    if(document.getElementById('pctRejected')) document.getElementById('pctRejected').innerText = pctRejected;

    const dBody = document.getElementById('dashTxnTableBody');
    if(dBody) { 
        dBody.innerHTML = ""; 
        if(finalTableData.length === 0) {
            dBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-400 font-bold text-sm">કોઈ ઓર્ડર જોવા મળ્યા નથી.</td></tr>`; 
        } else { 
            let recentData = finalTableData.sort((a,b) => {
                let [d1,m1,y1] = String(a.date).split('-'); let [d2,m2,y2] = String(b.date).split('-');
                return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
            }).slice(0, 8); 

            recentData.forEach(r => { 
                let headName = r.componentName || "-"; 
                let totalAmt = parseFloat(r.amount) || 0; 
                
                let pStat = r.unifiedStatus;
                let statusColor = 'text-amber-600 bg-amber-50 border-amber-200'; 
                let pStatText = "Pending in Treasury";
                let amountStyle = 'text-slate-800';

                if(pStat === "SUCCESS") {
                    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; pStatText = "Successful"; amountStyle = 'text-emerald-600';
                } else if(pStat === "REJECTED") {
                    statusColor = 'text-rose-700 bg-rose-50 border-rose-200'; pStatText = "Rejected / Failed"; amountStyle = 'text-rose-400 line-through'; 
                }

                let claimBox = typeof formatClaimDisplay === 'function' ? formatClaimDisplay(r.claimNo) : r.claimNo;

                dBody.innerHTML += `<tr class="hover:bg-slate-50/50 transition duration-200 group">
                    <td class="p-5 text-[11px] font-semibold text-slate-500 border-b border-slate-50">${escapeHtml(r.date)}</td>
                    <td class="p-5 font-bold text-xs text-slate-800 border-b border-slate-50">${escapeHtml(r.vendorName)}<br><span class="text-[9px] text-slate-400 font-medium tracking-wide">Head: ${escapeHtml(headName)}</span></td>
                    <td class="p-5 font-mono text-[11px] text-indigo-600 border-b border-slate-50">
                        ${claimBox}<br>
                        <span class="${statusColor} border px-2 py-1 rounded-md text-[9px] uppercase font-black tracking-wider inline-block mt-1.5 shadow-sm">${escapeHtml(pStatText)}</span>
                    </td>
                    <td class="p-5 ${amountStyle} font-black text-right text-sm border-b border-slate-50">₹${formatINR(totalAmt)}</td>
                </tr>`; 
            }); 
        } 
    }

    if(window.myPieChart) window.myPieChart.destroy();
    const ctx = document.getElementById('expenseChart');
    if(ctx) { 
        let chartLabels = Object.keys(headTotals).length > 0 ? Object.keys(headTotals) : ["No Expense"];
        let chartData = Object.keys(headTotals).length > 0 ? Object.values(headTotals) : [1];
        let chartColors = Object.keys(headTotals).length > 0 ? ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'] : ['#f1f5f9'];
        window.myPieChart = new Chart(ctx.getContext('2d'), { type: 'doughnut', data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: chartColors, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } } }); 
    }

    if(window.myBarChart) window.myBarChart.destroy();
    const bCtx = document.getElementById('monthlyBarChart');
    if(bCtx) { 
        let sortedMonths = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"]; 
        let barLabels = []; let barData = []; 
        sortedMonths.forEach(m => { if(monthTotals[m]) { barLabels.push(m.toUpperCase()); barData.push(monthTotals[m]); } }); 
        if(barLabels.length === 0) { barLabels = ["No Data"]; barData = [0]; } 
        window.myBarChart = new Chart(bCtx.getContext('2d'), { type: 'bar', data: { labels: barLabels, datasets: [{ label: 'માસિક ખર્ચ (₹)', data: barData, backgroundColor: '#6366f1', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } } }); 
    }

    patrakData = finalTableData.filter(r => r.unifiedStatus !== "REJECTED");

    let alertBox = document.getElementById('auditMatchAlert');
    let aIcon = document.getElementById('auditMatchIcon'); 
    let aTitle = document.getElementById('auditMatchTitle');
    
    if(alertBox) {
        alertBox.classList.remove('hidden', 'bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'bg-rose-50', 'text-rose-700', 'border-rose-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
        let diff = Math.abs(tPortalOfficial - pfmsPassed); 

        if (erpTotal > tGrant && tGrant > 0) {
            alertBox.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-200'); alertBox.classList.remove('hidden');
            if(aIcon) aIcon.innerHTML = `<i data-feather="alert-octagon" class="w-4 h-4"></i>`; if(aTitle) aTitle.innerText = "બજેટ મર્યાદા ઓળંગી ગઈ છે!";
        } else if (pfmsPending > 0) {
            alertBox.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-200'); alertBox.classList.remove('hidden');
            if(aIcon) aIcon.innerHTML = `<i data-feather="clock" class="w-4 h-4"></i>`; if(aTitle) aTitle.innerText = "ટ્રેઝરીમાં ઓર્ડર પ્રક્રિયામાં છે";
        } else if (diff <= 10 && tGrant > 0 && pfmsPassed > 0) {
            alertBox.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200'); alertBox.classList.remove('hidden');
            if(aIcon) aIcon.innerHTML = `<i data-feather="check-circle" class="w-4 h-4"></i>`; if(aTitle) aTitle.innerText = "100% Perfectly Matched";
        } else {
            alertBox.classList.add('hidden'); 
        }
    }

    runTreasuryWatchdog(rawClaimsData, rawEpayData);
    updateAccountingHeadDropdown();
    if(typeof feather !== 'undefined') feather.replace();
}

window.currentTreasuryData = [];
window.currentTreasuryFilter = 'ALL';

function runTreasuryWatchdog(claimsData, epayData) {
    let treasurySummary = [];

    const DICT = {
        SUCCESS: ["success", "pass", "approve", "clear", "settle", "match", "paid", "done", "ok", "accept", "generate", "disburse"],
        REJECTED: ["reject", "fail", "return", "cancel", "decline", "revoke", "mismatch", "error", "invalid", "stop", "suspend", "bounce"]
    };

    function getSmartCategory(rawStatus) {
        let s = String(rawStatus || "").toLowerCase().trim();
        if (!s || s === "n/a" || s === "-" || s === "undefined") return "PENDING";
        for (let w of DICT.REJECTED) { if (s.includes(w)) return "REJECTED"; }
        for (let w of DICT.SUCCESS) { if (s.includes(w)) return "SUCCESS"; }
        return "PENDING";
    }

    if (claimsData && claimsData.length > 0) {
        claimsData.forEach(c => {
            let keys = Object.keys(c);
            let statKey = keys.find(k => String(k).toUpperCase().includes('STATUS'));
            let claimKey = keys.find(k => String(k).toUpperCase().includes('CLAIM'));
            let amtKey = keys.find(k => String(k).toUpperCase().includes('GROSS') || String(k).toUpperCase().includes('AMOUNT'));

            let status = statKey ? String(c[statKey] || "").trim() : "";
            let claimNo = claimKey ? String(c[claimKey] || "Unknown").trim() : "Unknown";
            let amt = amtKey ? parseFloat(String(c[amtKey] || "0").replace(/,/g, '')) || 0 : 0;

            if (status && status.toUpperCase() !== "N/A" && status.toUpperCase() !== "UNDEFINED" && amt > 0) {
                treasurySummary.push({ claimNo: claimNo, amount: amt, status: status, type: getSmartCategory(status) });
            }
        });
    }

    if (epayData && epayData.length > 0) {
        epayData.forEach(ep => {
            let keys = Object.keys(ep);
            let statKey = keys.find(k => String(k).toUpperCase().includes('STATUS'));
            let claimKey = keys.find(k => String(k).toUpperCase().includes('CLAIM') || String(k).toUpperCase().includes('PPA'));
            let amtKey = keys.find(k => String(k).toUpperCase().includes('NET') || String(k).toUpperCase().includes('AMOUNT'));

            let status = statKey ? String(ep[statKey] || "").trim() : "";
            let claimNo = claimKey ? String(ep[claimKey] || "Unknown").trim() : "Unknown";
            let amt = amtKey ? parseFloat(String(ep[amtKey] || "0").replace(/,/g, '')) || 0 : 0;

            if (status && status.toUpperCase() !== "N/A" && status.toUpperCase() !== "UNDEFINED" && amt > 0) {
                let smartType = getSmartCategory(status);
                let existingIdx = treasurySummary.findIndex(pc => pc.claimNo === claimNo);
                if (existingIdx !== -1) {
                    treasurySummary[existingIdx].status = status;
                    treasurySummary[existingIdx].type = smartType;
                } else {
                    treasurySummary.push({ claimNo: claimNo, amount: amt, status: status, type: smartType });
                }
            }
        });
    }

    let existingBanner = document.getElementById('treasuryWatchdogBanner');
    if (existingBanner) existingBanner.remove();

    if (treasurySummary.length > 0) {
        let rejectedCount = treasurySummary.filter(p => p.type === 'REJECTED').length;
        let pendingCount = treasurySummary.filter(p => p.type === 'PENDING').length;
        let successCount = treasurySummary.filter(p => p.type === 'SUCCESS').length;

        let bannerTheme = 'bg-slate-50 border-slate-200';
        let titleText = '📊 Treasury Live Tracker';
        
        if (rejectedCount > 0) {
            bannerTheme = 'bg-rose-50 border-rose-300';
            titleText = '🚨 Treasury Rejection Alert!';
        } else if (pendingCount > 0) {
            bannerTheme = 'bg-amber-50 border-amber-300';
            titleText = '⏳ Treasury Processing (Pending)';
        } else {
            bannerTheme = 'bg-emerald-50 border-emerald-300';
            titleText = '✅ All Claims Successful!';
        }

        window._latestWatchdogData = treasurySummary;

        let bannerHtml = `
            <div id="treasuryWatchdogBanner" class="mb-6 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 view-enter border-2 ${bannerTheme}">
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="hidden md:flex w-12 h-12 rounded-2xl bg-white text-slate-700 items-center justify-center shrink-0 shadow-sm border border-slate-200">
                        <i data-feather="activity" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-black text-slate-800 text-base mb-2">${titleText}</h4>
                        <div class="flex flex-wrap gap-2 text-[11px] font-bold">
                            <span class="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">✅ Passed: <b>${successCount}</b></span>
                            <span class="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">⏳ Pending: <b>${pendingCount}</b></span>
                            <span class="bg-rose-100 text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm">❌ Rejected: <b>${rejectedCount}</b></span>
                        </div>
                    </div>
                </div>
                <button onclick="showWatchdogModal(window._latestWatchdogData)" class="bg-slate-800 text-white hover:bg-slate-900 px-5 py-3 rounded-xl font-bold text-xs shadow-md transition whitespace-nowrap w-full md:w-auto text-center">
                    Track All Claims 🔍
                </button>
            </div>
        `;

        let dashContainer = document.getElementById('tab-dashboard');
        if(dashContainer) {
            dashContainer.insertAdjacentHTML('afterbegin', bannerHtml);
            if (typeof feather !== 'undefined') feather.replace();
        }
    }
}

window.showWatchdogModal = function(treasurySummary) {
    window.currentTreasuryData = treasurySummary || [];
    window.currentTreasuryFilter = 'ALL';

    window.currentTreasuryData.sort((a, b) => {
        const order = { 'REJECTED': 1, 'PENDING': 2, 'SUCCESS': 3 };
        return (order[a.type] || 99) - (order[b.type] || 99);
    });

    let modalHtml = `
        <div class="mb-4 flex flex-col gap-3 text-left">
            <div class="relative">
                <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span class="text-slate-400">🔍</span>
                </div>
                <input type="text" id="wdSearch" onkeyup="filterWatchdogData()" placeholder="Search Claim No, Amount or Status..." class="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 outline-none transition shadow-sm bg-slate-50 focus:bg-white">
            </div>
            <div class="flex gap-2 overflow-x-auto premium-scroll pb-1">
                <button id="wdBtn_ALL" onclick="setWatchdogFilter('ALL')" class="wd-filter-btn flex-1 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm">All Claims</button>
                <button id="wdBtn_SUCCESS" onclick="setWatchdogFilter('SUCCESS')" class="wd-filter-btn flex-1 bg-slate-100 text-slate-600 hover:bg-emerald-100 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border border-slate-200">✅ Passed</button>
                <button id="wdBtn_PENDING" onclick="setWatchdogFilter('PENDING')" class="wd-filter-btn flex-1 bg-slate-100 text-slate-600 hover:bg-amber-100 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border border-slate-200">⏳ Pending</button>
                <button id="wdBtn_REJECTED" onclick="setWatchdogFilter('REJECTED')" class="wd-filter-btn flex-1 bg-slate-100 text-slate-600 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border border-slate-200">❌ Rejected</button>
            </div>
        </div>
        <div class="overflow-x-auto max-h-[350px] premium-scroll rounded-xl border border-slate-200 shadow-inner">
            <table class="w-full text-left">
                <thead class="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-widest sticky top-0 shadow-sm z-10">
                    <tr><th class="p-3 text-center">#</th><th class="p-3">Claim No</th><th class="p-3 text-right">Amount</th><th class="p-3 text-center">Status</th></tr>
                </thead>
                <tbody id="wdTableBody" class="divide-y divide-slate-100 bg-white">
                </tbody>
            </table>
        </div>
    `;

    Swal.fire({
        title: '<span class="text-xl font-black text-slate-800">📊 Live Treasury Tracker</span>',
        html: modalHtml,
        width: '650px',
        confirmButtonText: 'Great, Close!',
        confirmButtonColor: '#0f172a',
        didOpen: () => { window.filterWatchdogData(); }
    });
};

window.setWatchdogFilter = function(type) {
    window.currentTreasuryFilter = type;
    document.querySelectorAll('.wd-filter-btn').forEach(btn => {
        btn.className = "wd-filter-btn flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border border-slate-200";
    });
    let activeBtn = document.getElementById('wdBtn_' + type);
    if(activeBtn) {
        if(type === 'ALL') activeBtn.className = "wd-filter-btn flex-1 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-md";
        if(type === 'SUCCESS') activeBtn.className = "wd-filter-btn flex-1 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-md";
        if(type === 'PENDING') activeBtn.className = "wd-filter-btn flex-1 bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-md";
        if(type === 'REJECTED') activeBtn.className = "wd-filter-btn flex-1 bg-rose-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-md";
    }
    window.filterWatchdogData();
};

window.filterWatchdogData = function() {
    let searchInp = document.getElementById('wdSearch');
    let query = searchInp ? searchInp.value.toLowerCase().trim() : "";
    let tbody = document.getElementById('wdTableBody');
    if(!tbody) return;
    
    let filteredData = window.currentTreasuryData.filter(c => {
        let matchType = (window.currentTreasuryFilter === 'ALL' || c.type === window.currentTreasuryFilter);
        let matchQuery = String(c.claimNo).toLowerCase().includes(query) || 
                         String(c.amount).includes(query) || 
                         String(c.status).toLowerCase().includes(query);
        return matchType && matchQuery;
    });

    if(filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-400 font-bold text-sm">કોઈ ક્લેઈમ મળ્યો નથી!</td></tr>`;
        return;
    }

    let rowsHtml = "";
    filteredData.forEach((c, idx) => {
        let colorClass = 'text-slate-700 bg-slate-100 border-slate-200';
        let icon = '✅';
        if (c.type === 'REJECTED') { colorClass = 'text-rose-700 bg-rose-50 border-rose-200'; icon = '❌'; }
        else if (c.type === 'PENDING') { colorClass = 'text-amber-700 bg-amber-50 border-amber-200'; icon = '⏳'; }
        else if (c.type === 'SUCCESS') { colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200'; icon = '✅'; }

        rowsHtml += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition duration-200">
                <td class="p-3 text-xs font-bold text-slate-500 text-center border-r border-slate-50">${idx + 1}</td>
                <td class="p-3 text-xs font-mono font-bold text-indigo-600 border-r border-slate-50">${c.claimNo}</td>
                <td class="p-3 text-sm font-black text-right text-slate-800 border-r border-slate-50">₹ ${typeof formatINR === 'function' ? formatINR(c.amount) : c.amount}</td>
                <td class="p-3 text-center">
                    <span class="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${colorClass}">${icon} ${typeof escapeHtml === 'function' ? escapeHtml(c.status) : c.status}</span>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = rowsHtml;
};

function updateAccountingHeadDropdown() {
    let accHead = document.getElementById('accBudgetHead'); 
    let allHeadsInTxn = [...new Set(patrakData.map(item => item.componentName))]; 
    if(accHead) { let accVal = accHead.value; accHead.innerHTML = '<option value="ALL">All Heads</option>'; allHeadsInTxn.forEach(head => { if(head && head !== "-" && head !== "Unknown") accHead.innerHTML += `<option value="${escapeHtml(head)}">${escapeHtml(head)}</option>`; }); accHead.value = accVal; }
}

function refreshOrdersList(btn) {
    let origText = btn.innerHTML;
    btn.innerHTML = `<i data-feather="loader" class="animate-spin w-4 h-4 inline"></i> સિંક થાય છે...`;
    btn.disabled = true;
    if (typeof feather !== 'undefined') feather.replace();

    try { localStorage.removeItem("pmShriOrders_" + currentSchool.udise); } catch (e) {}
    google.script.run.clearOrdersCache(String(currentSchool.udise));

    loadDocs(true);
    loadLedgerForDashboard();

    setTimeout(() => {
        btn.innerHTML = origText;
        btn.disabled = false;
        if (typeof feather !== 'undefined') feather.replace();
    }, 2000);
}

function loadDocs(forceRefresh) {
  const udise = String(currentSchool && currentSchool.udise ? currentSchool.udise : "");
  const lsKey = "pmShriOrders_" + udise;
  const dList = document.getElementById("documentDownloadList");

  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.ts && (Date.now() - cached.ts) < 30 * 60 * 1000 && Array.isArray(cached.data)) {
          window._lastDocsRes = { success: true, data: cached.data, fromCache: true, debug: "LOCAL_CACHE" };
          globalDocsFull = cached.data;
          renderDocsPage(1, document.getElementById("searchDocs") ? document.getElementById("searchDocs").value : "");
          _fetchOrdersFromServer(udise, lsKey, false);
          return;
        }
      }
    } catch (e) {}
  }

  if (dList) {
    dList.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 font-bold">
      <i data-feather="loader" class="w-6 h-6 animate-spin inline mb-2"></i><br>Loading Orders...
    </div>`;
    if (typeof feather !== "undefined") feather.replace();
  }

  _fetchOrdersFromServer(udise, lsKey, !!forceRefresh);
}

function _fetchOrdersFromServer(udise, lsKey, forceRefresh) {
  google.script.run
    .withSuccessHandler(function (res) {
      window._lastDocsRes = res || {};
      const list = (res && res.success && Array.isArray(res.data)) ? res.data : [];
      globalDocsFull = list;

      try {
        localStorage.setItem(lsKey, JSON.stringify({ ts: Date.now(), data: list }));
      } catch (e) {}

      renderDocsPage(
        1,
        document.getElementById("searchDocs") ? document.getElementById("searchDocs").value : ""
      );
    })
    .withFailureHandler(function (err) {
      if (globalDocsFull && globalDocsFull.length > 0) return;
      window._lastDocsRes = { success: false, message: String(err) };
      globalDocsFull = [];
      renderDocsPage(1, "");
    })
    .getGeneratedOrders(udise, forceRefresh);
}

function renderDocsPage(page, searchQuery) {
  docsPage = page || 1;
  const q = (searchQuery || "").toLowerCase().trim();

  let mtlIndex = {};
  try {
      let mtlSrc = (typeof rawMtlData !== 'undefined' && rawMtlData.length > 0) ? rawMtlData : (window.lastDashboardRes?.mtl || []);
      if (mtlSrc.length > 0) {
          mtlSrc.forEach(m => {
              let keys = Object.keys(m);
              let tIdKey = keys.find(k => k.toUpperCase().includes("TXN_ID") || k.toUpperCase() === "TXN ID");
              let tId = tIdKey ? String(m[tIdKey]).toUpperCase() : "";
              
              if (tId) {
                  if (!mtlIndex[tId]) mtlIndex[tId] = { amt: 0, vendors: new Set(), claimStr: "" };
                  
                  let aKey = keys.find(k => k.toUpperCase() === "AMOUNT");
                  let amt = aKey ? parseFloat(String(m[aKey]||"0").replace(/,/g,'')) || 0 : 0;
                  mtlIndex[tId].amt += amt;
                  
                  let vKey = keys.find(k => k.toUpperCase().includes("VENDOR"));
                  let vName = vKey ? (m[vKey] || "") : "";
                  if (vName && vName !== "-") mtlIndex[tId].vendors.add(vName);
                  
                  let cKey = keys.find(k => k.toUpperCase().includes("CLAIM"));
                  let cl = cKey ? String(m[cKey] || "") : "";
                  if (cl && cl !== "-" && !cl.includes("PENDING") && !cl.includes("MANUAL")) {
                      mtlIndex[tId].claimStr = cl;
                  }
              }
          });
      }
  } catch(e) {}

  let enrichedDocs = (globalDocsFull || []).map(d => {
      let rawName = String(d.name || "Untitled");
      let jobId = d.jobId || ""; 
      
      if (!jobId) {
          const jobMatch = rawName.match(/(ORD-\d+|OLD-\d+|JOB-\d+)/i);
          if (jobMatch) jobId = jobMatch[1].toUpperCase();
      }

      let totalAmt = 0;
      let claimStr = "";
      let vStr = "";

      if (jobId && mtlIndex[jobId]) {
          totalAmt = mtlIndex[jobId].amt;
          claimStr = mtlIndex[jobId].claimStr;
          vStr = Array.from(mtlIndex[jobId].vendors).join(", ");
      }

      return { ...d, jobId: jobId, claimStr: claimStr, totalAmt: totalAmt, vendors: vStr };
  });

  let filtered = enrichedDocs.filter(function (d) {
    if (!q) return true;
    return (d.name || "").toLowerCase().indexOf(q) !== -1 ||
           (d.type || "").toLowerCase().indexOf(q) !== -1 ||
           (d.date || "").indexOf(q) !== -1 ||
           (d.jobId || "").toLowerCase().indexOf(q) !== -1 ||
           (d.claimStr || "").toLowerCase().indexOf(q) !== -1 ||
           (d.vendors || "").toLowerCase().indexOf(q) !== -1;
  });

  const totalPages = Math.ceil(filtered.length / DOCS_PER_PAGE) || 1;
  if (docsPage > totalPages) docsPage = totalPages;
  const start = (docsPage - 1) * DOCS_PER_PAGE;
  const paged = filtered.slice(start, start + DOCS_PER_PAGE);

  const dList = document.getElementById("documentDownloadList");
  if (!dList) return;
  dList.innerHTML = "";

  if (paged.length === 0) {
    const last = window._lastDocsRes || {};
    const msg = last.message || "કોઈ ફાઈલ જનરેટ થઈ નથી.";
    const dbg = last.debug ? `<div class="text-[10px] text-slate-400 mt-2 font-mono break-all">${escapeHtml(last.debug)}</div>` : "";
    dList.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
            <i data-feather="folder-minus" class="w-8 h-8 text-slate-300"></i>
        </div>
        <p class="text-slate-500 text-base font-bold">${escapeHtml(msg)}</p>
        <p class="text-xs text-slate-400 mt-1">જો ડ્રાઈવમાં ફાઈલો હોય તો ઉપર "Sync" બટન દબાવો.</p>
        ${dbg}
      </div>`;
  } else {
    paged.forEach(function (d) {
      const rawName = String(d.name || "Untitled");
      let orderType = "";
      let fileLabel = rawName;

      const typeMatch = rawName.match(/^(RECURRING|NON[_\s-]?RECURRING|ORDER|MANUAL)/i);
      if (typeMatch) orderType = typeMatch[1].toUpperCase().replace(/\s+/g, "_");

      if (orderType && d.jobId) {
        fileLabel = orderType.replace(/_/g, " ") + "  ·  " + d.jobId;
      } else if (d.jobId) {
        fileLabel = d.jobId;
      } else {
        fileLabel = rawName.replace(/\s*\(PDF\)\s*|\s*\(Doc\)\s*/gi, "").trim();
      }

      const dateFull = String(d.date || "-");
      let datePart = dateFull;
      let timePart = "";
      if (dateFull.indexOf(" ") !== -1) {
        const sp = dateFull.split(" ");
        datePart = sp[0];
        timePart = sp.slice(1).join(" ");
      }

      let iconName = "file";
      let badgeBg = "bg-slate-100 text-slate-600 border-slate-200";
      let btnBg = "bg-slate-800 hover:bg-slate-900";
      let gradient = "from-slate-500 to-slate-600";
      let typeText = d.type || "FILE";
      let openLabel = "Open File";

      if (d.type === "PDF") {
        iconName = "file-text";
        badgeBg = "bg-rose-50 text-rose-600 border-rose-200";
        btnBg = "bg-rose-600 hover:bg-rose-700 shadow-rose-200";
        gradient = "from-rose-500 to-pink-600";
        typeText = "PDF";
        openLabel = "View PDF";
      } else if (d.type === "DOC") {
        iconName = "edit-3";
        badgeBg = "bg-blue-50 text-blue-600 border-blue-200";
        btnBg = "bg-blue-600 hover:bg-blue-700 shadow-blue-200";
        gradient = "from-blue-500 to-indigo-600";
        typeText = "DOC";
        openLabel = "Edit Doc";
      }

      let orderChip = "";
      if (orderType) {
        const isRecurring = orderType.indexOf("RECURRING") !== -1 && orderType.indexOf("NON") === -1;
        const chipClass = isRecurring ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-violet-50 text-violet-700 border-violet-200";
        orderChip = `<span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm ${chipClass}">${escapeHtml(orderType.replace(/_/g, " "))}</span>`;
      }

      let formattedAmount = d.totalAmt > 0 ? (typeof formatINR === 'function' ? formatINR(d.totalAmt) : d.totalAmt.toLocaleString('en-IN')) : "0";

      dList.innerHTML += `
        <div class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-stretch mb-3">
            <div class="w-full sm:w-16 h-1.5 sm:h-auto bg-gradient-to-b ${gradient} flex items-center justify-center shrink-0">
                <i data-feather="${iconName}" class="w-6 h-6 text-white hidden sm:block opacity-90 group-hover:scale-110 transition-transform"></i>
            </div>
            
            <div class="flex-1 p-4 flex flex-col justify-between">
                <div class="flex justify-between items-start gap-3 mb-2.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        ${orderChip}
                        <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm ${badgeBg} flex items-center gap-1">
                            <i data-feather="${iconName}" class="w-2.5 h-2.5"></i> ${escapeHtml(typeText)}
                        </span>
                    </div>
                    ${d.totalAmt > 0 ? `<div class="shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg text-sm font-black shadow-sm tracking-tight flex items-center gap-1"><span class="font-sans font-bold">₹</span> ${formattedAmount}</div>` : ""}
                </div>
                
                <div class="mb-3">
                    <h4 class="text-slate-800 font-black text-sm leading-tight truncate mb-1" title="${escapeHtml(fileLabel)}">${escapeHtml(fileLabel)}</h4>
                    ${d.vendors ? `<p class="text-[11px] text-slate-500 font-bold truncate leading-none mt-1" title="${escapeHtml(d.vendors)}"><i data-feather="users" class="w-3 h-3 inline pb-0.5 text-slate-400"></i> ${escapeHtml(d.vendors)}</p>` : ""}
                </div>
                
                <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-auto">
                    <div class="flex items-center flex-wrap gap-2 md:gap-3 text-[10px] font-bold">
                        <span class="text-slate-500 flex items-center gap-1"><i data-feather="calendar" class="w-3 h-3 text-indigo-400"></i> ${escapeHtml(datePart)}</span>
                        ${d.jobId ? `<span class="text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono shadow-sm" title="Job ID">${escapeHtml(d.jobId)}</span>` : ""}
                        ${d.claimStr ? `<span class="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 font-mono shadow-sm" title="Claim Number"><i data-feather="hash" class="w-2.5 h-2.5"></i> Claim: ${escapeHtml(d.claimStr)}</span>` : ""}
                    </div>
                    <a href="${d.url}" target="_blank" rel="noopener" class="${btnBg} text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <i data-feather="external-link" class="w-3 h-3"></i> ${openLabel}
                    </a>
                </div>
            </div>
        </div>`;
    });
  }

  const pag = document.getElementById("docPagination");
  if (pag) {
    pag.innerHTML = "";
    if (totalPages > 1) {
      let pagHtml = `<div class="flex flex-wrap justify-center items-center gap-1.5 w-full mt-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm mx-auto max-w-fit">`;
      pagHtml += `<button onclick="renderDocsPage(Math.max(1, ${docsPage} - 1), document.getElementById('searchDocs')?.value || '')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition flex items-center gap-1 ${docsPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}" ${docsPage === 1 ? 'disabled' : ''}><i data-feather="chevron-left" class="w-4 h-4"></i> Prev</button>`;
      for (let i = 1; i <= totalPages; i++) {
        let activeCls = i === docsPage ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200";
        pagHtml += `<button onclick="renderDocsPage(${i}, document.getElementById('searchDocs')?.value || '')" class="w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${activeCls}">${i}</button>`;
      }
      pagHtml += `<button onclick="renderDocsPage(Math.min(${totalPages}, ${docsPage} + 1), document.getElementById('searchDocs')?.value || '')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition flex items-center gap-1 ${docsPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}" ${docsPage === totalPages ? 'disabled' : ''}>Next <i data-feather="chevron-right" class="w-4 h-4"></i></button></div>`;
      pag.innerHTML = pagHtml;
    }
  }
  if (typeof feather !== "undefined") feather.replace();
}

function toggleVendorForm(show) { document.getElementById('vendorListView').classList.toggle('hidden', show); document.getElementById('vendorFormView').classList.toggle('hidden', !show); if(!show) document.getElementById('snaVendorForm').reset(); if(typeof feather !== 'undefined') feather.replace(); }

function saveNewVendor(e) { 
  e.preventDefault(); 
  const acc1 = document.getElementById('vendorAcc1').value; 
  const acc2 = document.getElementById('vendorAcc2').value;
  
  if(acc1 !== acc2) { Swal.fire('Error', 'બેંક એકાઉન્ટ નંબર મેચ થતા નથી!', 'error'); return; }
  
  const payload = { 
      type: document.getElementById('vType').value, 
      prefix: document.getElementById('vPrefix').value, 
      name: document.getElementById('vName').value.toUpperCase().trim(), 
      accNo: acc1, 
      ifsc: document.getElementById('vIfsc').value.toUpperCase().trim(), 
      mobile: document.getElementById('vMobile').value, 
      udise: currentSchool.udise 
  };
  
  const btn = document.getElementById('saveVendorBtn'); 
  const originalText = btn.innerHTML; 
  btn.innerHTML = '<i data-feather="loader" class="animate-spin w-4 h-4"></i> સેવ થઈ રહ્યું છે...'; 
  btn.disabled = true; 
  if(typeof feather !== 'undefined') feather.replace();
  
  google.script.run.withSuccessHandler(res => { 
      Toast.fire({ icon: 'success', title: res.message }); 
      toggleVendorForm(false); 
      loadVendorsData(true); 
      
      btn.innerHTML = originalText; 
      btn.disabled = false; 
      if(typeof feather !== 'undefined') feather.replace(); 
  }).addVendorToMaster(payload);
}

function openManualEntryModal() { document.getElementById('manualEntryModal').classList.remove('hidden'); document.getElementById('oldDate').value = ""; document.getElementById('oldVendor').value = ""; document.getElementById('oldHead').value = ""; document.getElementById('oldCentralClaim').value = ""; document.getElementById('oldStateClaim').value = ""; document.getElementById('oldAmt').value = ""; document.getElementById('oldAmtWords').innerText = ""; document.getElementById('oldSlsCode').value = globalScheme !== 'ALL' ? globalScheme : (activeSchemes[0]?.code || 'GJ302'); }
function closeManualEntryModal() { document.getElementById('manualEntryModal').classList.add('hidden'); }

function submitOldEntry() {
    let date = document.getElementById('oldDate').value; let vendor = document.getElementById('oldVendor').value; let headName = document.getElementById('oldHead').value; let centralClaim = document.getElementById('oldCentralClaim').value.toUpperCase().trim(); let stateClaim = document.getElementById('oldStateClaim').value.toUpperCase().trim(); let amt = parseFloat(document.getElementById('oldAmt').value) || 0; let slsCode = document.getElementById('oldSlsCode').value;
    if(!date || !vendor || !headName || !amt) { Swal.fire('Error', 'કૃપા કરીને બધી માહિતી ભરો!', 'error'); return; }
    let [y, m, d] = date.split('-');
    let formattedDate = `${d}-${m}-${y}`; 
    let finalClaimStr = (centralClaim || "") + (stateClaim ? " / " + stateClaim : ""); if(!finalClaimStr) finalClaimStr = "MANUAL-ENTRY";
    let newRecord = { date: formattedDate, vendorName: vendor, componentName: headName, claimNo: finalClaimStr, amount: amt, udise: currentSchool.udise, schoolName: currentSchool.name, slsCode: slsCode };
    
    let btn = document.querySelector('#manualEntryModal button.bg-emerald-500'); let origText = btn.innerHTML; btn.innerHTML = '<i data-feather="loader" class="animate-spin inline w-4 h-4"></i> Saving...'; btn.disabled = true; if(typeof feather !== 'undefined') feather.replace();
    google.script.run.withSuccessHandler(res => { 
        btn.innerHTML = origText; btn.disabled = false; if(typeof feather !== 'undefined') feather.replace(); 
        if(res.success) { 
            Toast.fire({ icon: 'success', title: res.message }); 
            closeManualEntryModal(); 
            
            localStorage.removeItem('pmShriDash_' + currentSchool.udise);
            if(typeof loadLedgerForDashboard === 'function') loadLedgerForDashboard(true);
            
            let isEnTab = document.getElementById('tab-accounting-en') && document.getElementById('tab-accounting-en').classList.contains('active'); 
            if(typeof generateAccountingReport === 'function') generateAccountingReport(isEnTab); 
        } else { Swal.fire('Error', res.message, 'error'); } 
    }).withFailureHandler(err => { 
        btn.innerHTML = origText; btn.disabled = false; if(typeof feather !== 'undefined') feather.replace(); 
        Swal.fire('Error', "Connection failed: " + err, 'error'); 
    }).saveManualOldEntry(newRecord);
}

function submitFinalOrder() {
    try {
        const orderTypeEl = document.getElementById('orderType'); const orderType = orderTypeEl ? orderTypeEl.value : "RECURRING";
        const centralClaimEl = document.getElementById('centralClaimNo'); let centralClaim = centralClaimEl ? centralClaimEl.value.toUpperCase().trim() : ""; 
        const stateClaimEl = document.getElementById('stateClaimNo'); let stateClaim = stateClaimEl ? stateClaimEl.value.toUpperCase().trim() : "";
        const billRegNoEl = document.getElementById('billRegNo'); const billRegNo = billRegNoEl ? billRegNoEl.value : ""; 
        const billRegPageEl = document.getElementById('billRegPage'); const billRegPage = billRegPageEl ? billRegPageEl.value : "";
        const officeOrderNoEl = document.getElementById('officeOrderNo'); const officeOrderNo = officeOrderNoEl ? officeOrderNoEl.value : "1"; 
        const slsCodeEl = document.getElementById('wizardSlsCode'); const slsCode = slsCodeEl ? slsCodeEl.value : "";
        const orderDateEl = document.getElementById('orderDateInput'); const orderDateVal = orderDateEl ? orderDateEl.value : "";

        if (!centralClaim && !stateClaim) centralClaim = "PENDING";
        if (!orderDateVal) return Swal.fire('Error', 'કૃપા કરીને આદેશની તારીખ પસંદ કરો.', 'error');
        if (!billRegNo || !billRegPage) return Swal.fire('Error', 'કૃપા કરીને બિલ રજીસ્ટરની વિગતો દાખલ કરો.', 'error');
        if (!officeOrderNo) return Swal.fire('Error', 'કૃપા કરીને આદેશ નંબર (Order No) દાખલ કરો.', 'error'); 

        let [oY, oM, oD] = orderDateVal.split('-'); const formattedOrderDate = `${oD}-${oM}-${oY}`;
        let vendorsListArray = []; let ledgerListArray = []; let tdsListArray = []; let uniqueComps = new Set(); let isValid = true;

        let vRows = document.querySelectorAll('#previewVendorTableBody tr');
        if (vRows.length === 0) return Swal.fire('Error', 'Please add vendors and amount first.', 'error');

        const getGujaratiName = (rawCode, cellElement) => {
            let textToParse = rawCode;
            if (cellElement) {
                let tsItem = cellElement.querySelector('.item[data-ts-item]');
                if (tsItem) textToParse = tsItem.innerText.trim();
                else textToParse = cellElement.innerText.trim();
            }
            let match = textToParse.match(/-\s*\((.*?)\)/);
            if (match && match[1]) return match[1].trim();
            let parts = textToParse.split(" - ");
            if (parts.length > 1) return parts[parts.length - 1].replace(/^\(\vert{}\)$/g, '').trim();
            if (typeof customHeadsMap !== 'undefined' && customHeadsMap[rawCode]) return customHeadsMap[rawCode];
            return textToParse;
        };

        vRows.forEach(row => {
            let vNameEl = row.querySelector('.v-name'); let vName = vNameEl ? vNameEl.innerText : "-";
            let headsEl = row.querySelector('.v-heads'); let headsStr = headsEl ? headsEl.value : "-";

            let finalCodesArray = [];
            let finalGujNamesArray = [];
            let finalEnNamesArray = [];

            if (headsStr !== "-") {
                headsStr.split(",").forEach(h => {
                    let cleanH = h.trim();
                    let compObj = window.masterCompMap ? window.masterCompMap[cleanH] : null;
                    
                    if (compObj) {
                        finalCodesArray.push(compObj.code);
                        finalGujNamesArray.push(compObj.gu);
                        finalEnNamesArray.push(compObj.en); 
                    } else {
                        finalCodesArray.push("CUSTOM");
                        finalGujNamesArray.push(getGujaratiName(cleanH, row.cells[1]));
                        finalEnNamesArray.push(cleanH); 
                    }
                });
            }

            let perfectComponentCode = finalCodesArray.length > 0 ? finalCodesArray.join(", ") : "-";
            let perfectComponentGu = finalGujNamesArray.length > 0 ? finalGujNamesArray.join(", ") : "-";
            let perfectComponentEn = finalEnNamesArray.length > 0 ? finalEnNamesArray.join(", ") : "-";
            
            let combinedComponentName = `${perfectComponentEn} - (${perfectComponentGu})`;

            let billsEl = row.querySelector('.v-bills'); let billsStr = billsEl ? billsEl.value : "-"; 
            let centEl = row.querySelector('.v-cent'); let cent = centEl ? parseFloat(centEl.value) || 0 : 0;
            let stateEl = row.querySelector('.v-state'); let state = stateEl ? parseFloat(stateEl.value) || 0 : 0;
            let totalEl = row.querySelector('.v-total'); let total = totalEl ? parseFloat(totalEl.innerText) || 0 : 0;

            if(Math.abs((cent + state) - total) > 0.05) { isValid = false; return; }
            if(perfectComponentGu !== "-") { perfectComponentGu.split(",").forEach(h => uniqueComps.add(h.trim())); }

            let vAccNo = "-", vIfsc = "-";
            if (typeof globalVendorsFull !== 'undefined') {
                let vMatch = globalVendorsFull.find(gv => gv.name === vName);
                if (vMatch) { vAccNo = vMatch.accNo || "-"; vIfsc = vMatch.ifsc || "-"; }
            }

            vendorsListArray.push({ 
                name: vName, 
                accNo: vAccNo, 
                ifsc: vIfsc, 
                componentCode: perfectComponentCode, 
                componentName: combinedComponentName, 
                componentNameEn: perfectComponentEn,  
                componentNameGu: perfectComponentGu,  
                billNo: billsStr, 
                totalAmount: total, 
                centralShare: cent, 
                stateShare: state 
            }); 
        });

        document.querySelectorAll('.vendor-card').forEach(card => {
            let vSel = card.querySelector('.vendor-select'); let vName = vSel ? vSel.value : "-";
            let hSel = card.querySelector('.comp-select'); let cName = hSel ? hSel.value : "-";

            let finalCode = "CUSTOM";
            let finalGujName = cName;
            let finalEnName = cName;
            
            if (cName !== "-" && window.masterCompMap && window.masterCompMap[cName.trim()]) { 
                let compObj = window.masterCompMap[cName.trim()];
                finalCode = compObj.code;
                finalGujName = compObj.gu;
                finalEnName = compObj.en;
            } else if (cName !== "-" && typeof customHeadsMap !== 'undefined') {
                finalGujName = customHeadsMap[cName.trim()] ? customHeadsMap[cName.trim()] : cName;
            }
            
            let combinedComponentName = `${finalEnName} - (${finalGujName})`;

            let bInp = card.querySelector('.bill-input'); let bNo = bInp ? bInp.value : "-";
            let amtInp = card.querySelector('.row-input'); let amt = parseFloat(amtInp.value) || 0;
            let cent = Math.round(amt * 0.60); let state = amt - cent;
            
            if(amt > 0) { 
                ledgerListArray.push({ 
                    name: vName, 
                    componentCode: finalCode, 
                    componentName: combinedComponentName, 
                    componentNameEn: finalEnName,
                    componentNameGu: finalGujName,
                    billNo: bNo, 
                    totalAmount: amt, 
                    centralShare: cent, 
                    stateShare: state 
                }); 
            }

            if (card.dataset.tdsApplied === "true") {
                tdsListArray.push({
                    vendorName: vName,
                    panNumber: card.dataset.panNumber || "",
                    grossAmount: parseFloat(card.dataset.grossAmount) || 0,
                    tdsAmount: (parseFloat(card.dataset.grossAmount) || 0) - amt
                });
            }
        });

        if(!isValid) return Swal.fire('Error', 'કોઈ એક વેન્ડરના 60% અને 40% નો સરવાળો કુલ રકમ સાથે મેચ થતો નથી.', 'error');
        if(vendorsListArray.length === 0) return Swal.fire('Error', 'Please select vendor and amount.', 'error');

        let hasDuplicate = false;
        if (typeof patrakData !== 'undefined' && patrakData.length > 0) {
            for (let v of vendorsListArray) {
                let vName = String(v.name).toLowerCase().trim();
                let bNo = String(v.billNo).toLowerCase().trim();

                if (bNo && bNo !== "-" && bNo !== "n/a") {
                    let dupMatch = patrakData.find(r => 
                        String(r.vendorName).toLowerCase().trim() === vName && 
                        String(r.vchNo || r.billNo).toLowerCase().trim() === bNo && 
                        r.unifiedStatus !== "REJECTED"
                    );

                    if (dupMatch) {
                        hasDuplicate = true;
                        Swal.fire('🚨 સિક્યોરિટી એલર્ટ', `તમે <b>${escapeHtml(v.name)}</b> નું બિલ નંબર <b>${escapeHtml(v.billNo)}</b> સબમિટ કરી રહ્યા છો, પરંતુ તે બિલ અગાઉ ચૂકવાઈ ગયું છે! કૃપા કરીને બિલ નંબર બદલો.`, 'error');
                        break;
                    }
                }
            }
        }
        if (hasDuplicate) return;

        const autoOrderPurpose = Array.from(uniqueComps).join(", ");
        let savedGuj = JSON.parse(localStorage.getItem('pmShriGujNames_' + currentSchool.udise) || "{}");
        let ptEl = document.getElementById('previewTotal');
        let grandTotal = ptEl ? parseFloat(ptEl.innerText.replace(/,/g, '')) : 0;

        const executeSubmission = (matchedTemplateObj) => {
            let safeTemplateId = matchedTemplateObj["TEMPLATE ID (GOOGLE DOC)"] || matchedTemplateObj.templateId;
            let designation = matchedTemplateObj["HEAD DESIGNATION (હોદ્દો)"] || matchedTemplateObj.designation || "આચાર્યશ્રી"; 
            let centralBlock = matchedTemplateObj["CENTRAL BUDGET BLOCK"] || matchedTemplateObj.centralBlock || "";
            let stateBlock = matchedTemplateObj["STATE BUDGET BLOCK"] || matchedTemplateObj.stateBlock || "";
            let tagsData = matchedTemplateObj["EXTRA TAGS (JSON)"] || matchedTemplateObj.extraTagsJson || matchedTemplateObj.extraTags;

            let dynamicTagsBox = {
                "{{HEAD_DESIGNATION}}": designation,
                "{{INSTITUTE_NAME}}": savedGuj.school || currentSchool.name,
                "{{SCHOOL_NAME}}": savedGuj.school || currentSchool.name,
                "{{UDISE}}": currentSchool.udise,
                "{{STATE}}": currentSchool.state || "GUJARAT",
                "{{DISTRICT}}": savedGuj.district || currentSchool.district || "",
                "{{TALUKA}}": savedGuj.taluka || currentSchool.taluka || "",
                "{{ORDER_DATE}}": formattedOrderDate,
                "{{TOTAL_AMOUNT}}": grandTotal,                  
                "{{AMOUNT_IN_WORDS}}": (typeof getGujaratiWords === 'function' ? getGujaratiWords(grandTotal) : grandTotal),                  
                "{{OFFICE_ORDER_NO}}": officeOrderNo, 
                "{{BILL_REG_NO}}": billRegNo || "-",
                "{{BILL_REG_PAGE}}": billRegPage || "-",
                "{{ORDER_PURPOSE}}": autoOrderPurpose,
                "{{CENTRAL_BUDGET_BLOCK}}": centralBlock,
                "{{STATE_BUDGET_BLOCK}}": stateBlock,
                "{{CENTRAL_CLAIM}}": centralClaim || "PENDING",
                "{{STATE_CLAIM}}": stateClaim || "PENDING",
                "{{CODE_LABEL}}": "UDISE CODE",
                "{{IN_INSTITUTE_LABEL}}": "શાળા કક્ષાએ",
                "{{COMMITTEE_NAME}}": "S.M.C. કમિટી"
            };

            let districtTableColumns = ["ક્રમ", "પાર્ટીનું નામ", "બેંક ખાતા નંબર", "IFSC કોડ", "રકમ (₹)"];

            if (tagsData && tagsData !== "{}" && tagsData !== "") {
                try { 
                    let cleanTags = (typeof tagsData === 'string') ? tagsData.replace(/[\n\r\t]/g, "").replace(/“/g, '"').replace(/”/g, '"').replace(/&quot;/g, '"') : tagsData;
                    let sheetTags = (typeof cleanTags === 'string') ? JSON.parse(cleanTags) : Object.assign({}, cleanTags); 
                    
                    if (sheetTags["TABLE_COLUMNS"] || sheetTags["table_columns"]) {
                        districtTableColumns = sheetTags["TABLE_COLUMNS"] || sheetTags["table_columns"];
                    }
                    Object.assign(dynamicTagsBox, sheetTags); 
                } catch(e) { 
                    console.error("JSON Parse Error in submitFinalOrder: ", e); 
                }
            }

            let dynamicTablesConfig = [];
            
            let totalCentral = vendorsListArray.reduce((sum, v) => sum + v.centralShare, 0);
            if (totalCentral > 0) {
                dynamicTablesConfig.push({
                    title: "કેન્દ્ર સરકારનો હિસ્સા પેટે (૬૦%)",
                    claimNo: centralClaim || "PENDING",
                    budgetBlock: matchedTemplateObj.centralBlock || "",
                    shareType: "CENTRAL" 
                });
            }

            let totalState = vendorsListArray.reduce((sum, v) => sum + v.stateShare, 0);
            if (totalState > 0) {
                dynamicTablesConfig.push({
                    title: "રાજ્ય સરકારનો હિસ્સા પેટે (૪૦%)",
                    claimNo: stateClaim || "PENDING",
                    budgetBlock: matchedTemplateObj.stateBlock || "",
                    shareType: "STATE"
                });
            }

            let pmLogoToUse = "";
            let ssaLogoToUse = "";
            let schoolLogoToUse = "";
            let usePm = false, useSsa = false;

            if (typeof logoSettings !== 'undefined') {
                usePm = !!logoSettings.usePmShri;
                useSsa = !!logoSettings.useSsa;
                if (usePm) pmLogoToUse = logoSettings.pmShriLogoUrl || (typeof DEFAULT_PMSHRI_LOGO !== 'undefined' ? DEFAULT_PMSHRI_LOGO : "");
                if (useSsa) ssaLogoToUse = logoSettings.ssaLogoUrl || (typeof DEFAULT_SSA_LOGO !== 'undefined' ? DEFAULT_SSA_LOGO : "");
                if (logoSettings.useSchoolLogo && logoSettings.schoolLogoUrl) schoolLogoToUse = logoSettings.schoolLogoUrl;
            } else {
                pmLogoToUse = typeof DEFAULT_PMSHRI_LOGO !== 'undefined' ? DEFAULT_PMSHRI_LOGO : "";
                ssaLogoToUse = typeof DEFAULT_SSA_LOGO !== 'undefined' ? DEFAULT_SSA_LOGO : "";
                usePm = true;
                useSsa = true;
            }

            const payload = { 
                templateDocId: safeTemplateId, 
                schoolUdise: currentSchool.udise, 
                schoolName: currentSchool.name, 
                templateType: orderType, 
                slsCode: slsCode, 
                dynamicTags: dynamicTagsBox, 
                vendorsList: vendorsListArray, 
                ledgerList: ledgerListArray, 
                schoolLogo: schoolLogoToUse,
                pmShriLogo: pmLogoToUse,
                ssaLogo: ssaLogoToUse,
                usePmLogo: usePm,   
                useSsaLogo: useSsa,
                tdsList: tdsListArray,
                tableColumns: districtTableColumns,
                dynamicTables: dynamicTablesConfig
            };

            const submitBtn = document.getElementById('finalSubmitBtn'); const originalText = submitBtn.innerHTML; 
            submitBtn.innerHTML = '<i data-feather="loader" class="animate-spin inline w-5 h-5"></i> પ્રોસેસિંગ...'; 
            submitBtn.disabled = true; if(typeof feather !== 'undefined') feather.replace();

            google.script.run.withSuccessHandler(res => {
                submitBtn.innerHTML = originalText; submitBtn.disabled = false; if(typeof feather !== 'undefined') feather.replace();
                if (res.success) {
                  localStorage.setItem('pmShriLastBillNo_' + currentSchool.udise, billRegNo);
                  localStorage.setItem('pmShriLastPageNo_' + currentSchool.udise, billRegPage);
                  localStorage.setItem('pmShriLastOrderNo_' + currentSchool.udise, officeOrderNo); 
                  localStorage.removeItem('pmShriWizardDraft_' + currentSchool.udise); 
                  localStorage.removeItem('pmShriDash_' + currentSchool.udise);
                  if (typeof loadLedgerForDashboard === 'function') loadLedgerForDashboard(true);
                  try {localStorage.removeItem("pmShriOrders_" + currentSchool.udise);} catch (e) {}
                  if (typeof google.script.run.clearOrdersCache === 'function') google.script.run.clearOrdersCache(String(currentSchool.udise));

                  if (typeof confetti === 'function') {
                      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#4f46e5', '#10b981', '#fbbf24'] });
                  }

                  Swal.fire({ title: 'આદેશ જનરેટ થઈ ગયો!', text: "તમારો ઓર્ડર સફળતાપૂર્વક બની ગયો છે.", icon: 'success', confirmButtonColor: '#10b981' })
                  .then(() => { 
                      let cc = document.getElementById('centralClaimNo'); if(cc) cc.value = ''; 
                      let sc = document.getElementById('stateClaimNo'); if(sc) sc.value = ''; 
                      let mc = document.getElementById('mobileCardsContainer'); if(mc) mc.innerHTML = ''; 
                      if(typeof addVendorCard === 'function') addVendorCard(); 
                      if(typeof goToStep === 'function') goToStep(1); 
                      window.open(res.pdfUrl, '_blank'); 
                  });
                } else { Swal.fire('Error', res.message, 'error'); }
            }).withFailureHandler(err => { 
                submitBtn.innerHTML = originalText; submitBtn.disabled = false; if(typeof feather !== 'undefined') feather.replace(); 
                Swal.fire('Error', "Connection Failed: " + err.message, 'error'); 
            }).generateOrderDirectly(payload); 
        };

        let currentOrderType = String(orderType).toUpperCase().trim();
        let cacheKey = 'pmShriTemplates_' + currentSchool.udise;
        let cachedTemplatesStr = localStorage.getItem(cacheKey);
        let templatesData = [];

        try { if (cachedTemplatesStr) templatesData = JSON.parse(cachedTemplatesStr); } catch (e) { localStorage.removeItem(cacheKey); }

        let match = templatesData.find(t => 
             (t["GRANT TYPE"] && t["GRANT TYPE"].toUpperCase() === currentOrderType) || 
             (t.grantType && t.grantType.toUpperCase() === currentOrderType)
        );
        if (match) { executeSubmission(match); } else { Swal.fire('Error', 'ગ્રાન્ટ માટેનું ટેમ્પલેટ મળ્યું નથી! કૃપા કરીને પેજ રિફ્રેશ કરો.', 'error'); }
    } catch (err) { Swal.fire('System Error', err.message, 'error'); console.error(err); }
}

function switchRegisterView(viewId) {
    document.querySelectorAll('.reg-view').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    document.querySelectorAll('.reg-tab-btn').forEach(btn => { btn.className = "reg-tab-btn flex-1 min-w-[120px] py-2.5 rounded-xl font-bold text-sm bg-white text-slate-500 hover:text-emerald-600 border border-slate-200 transition"; });

    let targetView = document.getElementById('reg-view-' + viewId);
    if(targetView) { targetView.classList.remove('hidden'); targetView.classList.add('block'); }
    
    let activeBtn = document.getElementById('btn-reg-' + viewId);
    if(activeBtn) { 
        let color = 'emerald';
        if(viewId === 'quotations') color = 'indigo';
        if(viewId === 'form27') color = 'amber';
        activeBtn.className = `reg-tab-btn flex-1 min-w-[120px] py-2.5 rounded-xl font-bold text-sm bg-${color}-50 text-${color}-700 border border-${color}-200 shadow-sm transition`; 
    }
    try { feather.replace(); } catch(e){}
}

function openNewEntryModal() {
    if(!document.getElementById('reg-view-meetings').classList.contains('hidden')) {
        document.getElementById('mtgDate').valueAsDate = new Date();
        document.getElementById('modalMeeting').classList.remove('hidden');
    } 
    else if(!document.getElementById('reg-view-stock').classList.contains('hidden')) {
        document.getElementById('stkDate').valueAsDate = new Date();
        document.getElementById('modalStock').classList.remove('hidden');
    } 
    else if(!document.getElementById('reg-view-deadstock').classList.contains('hidden')) {
        document.getElementById('dsDate').valueAsDate = new Date();
        document.getElementById('modalDeadstock').classList.remove('hidden');
    }
    else if(!document.getElementById('reg-view-quotations').classList.contains('hidden')) {
        document.getElementById('qDate').valueAsDate = new Date();
        document.getElementById('qResultBox').classList.add('hidden');
        document.getElementById('modalQuotation').classList.remove('hidden');
        setTimeout(() => {
            let vOpts = (typeof vOptionsGlobal !== 'undefined') ? vOptionsGlobal : [];
            ['qVendor1', 'qVendor2', 'qVendor3'].forEach(id => { let el = document.getElementById(id); if(el) initTomSelect(el, vOpts, "🔍 વેન્ડર શોધો..."); });
        }, 100);
    }
    else if(!document.getElementById('reg-view-form27').classList.contains('hidden')) {
        let d = new Date(); let monthVal = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
        document.getElementById('f27Month').value = monthVal;
        document.getElementById('modalForm27').classList.remove('hidden');
    }
}

function closeRegisterModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

let currentWinner = { name: "", amount: 0 };
let currentForm27Total = 0;

function calculateLowestBidder() {
    let v1 = document.getElementById('qVendor1').value; let p1 = parseFloat(document.getElementById('qPrice1').value) || 0;
    let v2 = document.getElementById('qVendor2').value; let p2 = parseFloat(document.getElementById('qPrice2').value) || 0;
    let v3 = document.getElementById('qVendor3').value; let p3 = parseFloat(document.getElementById('qPrice3').value) || 0;

    if(!v1 || !v2 || !v3 || p1 === 0 || p2 === 0 || p3 === 0) return Swal.fire('Error', 'કૃપા કરીને ત્રણેય વેન્ડરના નામ અને ભાવ બરાબર ભરો.', 'error');
    
    let bids = [ { name: v1, price: p1 }, { name: v2, price: p2 }, { name: v3, price: p3 } ];
    bids.sort((a, b) => a.price - b.price);
    
    currentWinner.name = bids[0].name; currentWinner.amount = bids[0].price;
    document.getElementById('qWinnerName').innerText = currentWinner.name;
    document.getElementById('qWinnerPrice').innerText = formatINR(currentWinner.amount);
    
    let rb = document.getElementById('qResultBox'); rb.classList.remove('hidden'); rb.classList.add('animate-pulse');
    setTimeout(() => rb.classList.remove('animate-pulse'), 1000);
}

function addLaborRow() {
    const tbody = document.getElementById('f27LaborBody'); const row = document.createElement('tr');
    row.innerHTML = `
        <td class="p-1"><input type="text" class="f27-name modern-input w-full p-2 rounded-lg text-xs font-bold" placeholder="નામ..."></td>
        <td class="p-1"><input type="text" class="f27-desig modern-input w-full p-2 rounded-lg text-xs font-bold" placeholder="કડીયો/મજૂર"></td>
        <td class="p-1"><input type="number" class="f27-days modern-input w-full p-2 rounded-lg text-xs font-black text-center" placeholder="0" oninput="calcForm27Total()"></td>
        <td class="p-1"><input type="number" class="f27-rate modern-input w-full p-2 rounded-lg text-xs font-black text-right" placeholder="0" oninput="calcForm27Total()"></td>
        <td class="p-1"><input type="number" class="f27-deduct modern-input w-full p-2 rounded-lg text-xs font-black text-right text-rose-500" placeholder="0" oninput="calcForm27Total()"></td>
        <td class="p-1 text-right font-black text-indigo-700 flex items-center justify-end gap-1 mt-1">₹<span class="f27-row-total">0</span><button type="button" onclick="this.closest('tr').remove(); calcForm27Total();" class="text-rose-500 hover:text-rose-700 font-bold ml-1">✕</button></td>
    `;
    tbody.appendChild(row);
}

function calcForm27Total() {
    let grandTotal = 0;
    document.querySelectorAll('#f27LaborBody tr').forEach(row => {
        let days = parseFloat(row.querySelector('.f27-days').value) || 0; 
        let rate = parseFloat(row.querySelector('.f27-rate').value) || 0;
        let deduct = parseFloat(row.querySelector('.f27-deduct').value) || 0;
        let total = (days * rate) - deduct;
        if(total < 0) total = 0;
        row.querySelector('.f27-row-total').innerText = formatINR(total); 
        grandTotal += total;
    });
    currentForm27Total = grandTotal; 
    document.getElementById('f27GrandTotal').innerText = formatINR(grandTotal);
}

function magicLinkToVoucher(type) {
    let targetName = ""; let targetAmount = 0; let targetPurpose = "";
    if (type === 'quotation') {
        targetName = currentWinner.name; targetAmount = currentWinner.amount; targetPurpose = document.getElementById('qItem').value + " (L1 Bidder)";
        closeRegisterModal('modalQuotation');
    } else if (type === 'form27') {
        targetName = "Principal (Self) / રોકડ ઉપાડ"; targetAmount = currentForm27Total; targetPurpose = document.getElementById('f27Work').value + " (Form 27)";
        if(targetAmount === 0) return Swal.fire('Error', 'મજૂરીની રકમ શૂન્ય છે.', 'error');
        closeRegisterModal('modalForm27');
    }

    switchTab('voucher');
    setTimeout(() => {
        Swal.fire({ title: '✨ Magic Link Active', text: 'તમારી વિગતો વાઉચરમાં ઓટો-ફિલ થઈ રહી છે...', icon: 'success', timer: 1500, showConfirmButton: false });
        let vAmt = document.getElementById('vAmt'); if(vAmt) { vAmt.value = targetAmount; if(typeof generateWords === 'function') generateWords('vAmt', 'vAmtWords'); }
        let vText = document.getElementById('vVoucherText'); if(vText) vText.value = `આ વાઉચર દ્વારા ${targetPurpose} માટે ચૂકવણી કરવામાં આવે છે.`;
        let vPayeeEl = document.getElementById('vPayee');
        if (vPayeeEl && vPayeeEl.tomselect) { vPayeeEl.tomselect.addOption({value: targetName, text: targetName}); vPayeeEl.tomselect.setValue(targetName); }
        else if (vPayeeEl) { vPayeeEl.value = targetName; }
    }, 300);
}

function saveAuditLog(type) {
    let payload = { udise: currentSchool.udise };
    let btnHtml = "";
    
    if (type === 'quotation') {
        let qItem = document.getElementById('qItem').value;
        let qDate = document.getElementById('qDate').value;
        
        if(!qItem || !qDate || !currentWinner.name) return Swal.fire('Error', 'ખરીદીની વિગત, તારીખ અને રિઝલ્ટ ફરજીયાત છે.', 'error');
        
        payload.date = qDate;
        payload.item = qItem;
        payload.l1Name = currentWinner.name;
        payload.l1Price = currentWinner.amount;
        
        payload.v1Name = document.getElementById('qVendor1').value;
        payload.v1Price = document.getElementById('qPrice1').value;
        payload.v2Name = document.getElementById('qVendor2').value;
        payload.v2Price = document.getElementById('qPrice2').value;
        payload.v3Name = document.getElementById('qVendor3').value;
        payload.v3Price = document.getElementById('qPrice3').value;
    } 
    else if (type === 'form27') {
        let fWork = document.getElementById('f27Work').value;
        let fMonth = document.getElementById('f27Month').value;
        
        if(!fWork || !fMonth) return Swal.fire('Error', 'કામની વિગત અને મહિનો ફરજીયાત છે.', 'error');
        
        let laborList = [];
        document.querySelectorAll('#f27LaborBody tr').forEach(row => {
            let name = row.querySelector('.f27-name').value;
            let desig = row.querySelector('.f27-desig') ? row.querySelector('.f27-desig').value : "મજૂર";
            let days = row.querySelector('.f27-days').value;
            let rate = row.querySelector('.f27-rate').value;
            let deduct = row.querySelector('.f27-deduct') ? row.querySelector('.f27-deduct').value : "0";
            let total = parseFloat(row.querySelector('.f27-row-total').innerText.replace(/,/g, '')) || 0;
            
            if(name && total > 0) laborList.push({name, desig, days, rate, deduct, total});
        });
        
        if(laborList.length === 0) return Swal.fire('Error', 'ઓછામાં ઓછા એક મજૂરની વિગત ભરો.', 'error');
        
        let d = new Date();
        payload.date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
        payload.month = fMonth;
        payload.work = fWork;
        payload.total = currentForm27Total;
        payload.laborData = JSON.stringify(laborList);
    }

    let activeModal = type === 'quotation' ? document.getElementById('qResultBox') : document.getElementById('modalForm27');
    let btn = activeModal.querySelector('button[onclick="saveAuditLog(\''+type+'\')"]');
    if(btn) { btnHtml = btn.innerHTML; btn.innerHTML = '<i data-feather="loader" class="animate-spin w-4 h-4 inline"></i> સેવ થાય છે...'; btn.disabled = true; if(typeof feather !== 'undefined') feather.replace(); }

    let actionMethod = type === 'quotation' ? 'saveQuotationLog' : 'saveForm27Log';
    
    google.script.run
        .withSuccessHandler(res => {
            if(btn) { btn.innerHTML = btnHtml; btn.disabled = false; if(typeof feather !== 'undefined') feather.replace(); }
            if(res.success) {
                Toast.fire({ icon: 'success', title: res.message });
                if(type === 'quotation') closeRegisterModal('modalQuotation');
                if(type === 'form27') closeRegisterModal('modalForm27');
                
                if(typeof loadOfficeRegistersData === 'function') {
                    loadOfficeRegistersData(currentSchool.udise);
                }
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        })
        .withFailureHandler(err => {
            if(btn) { btn.innerHTML = btnHtml; btn.disabled = false; if(typeof feather !== 'undefined') feather.replace(); }
            Swal.fire('Error', err.message, 'error');
        })
        [actionMethod](payload);
}

function submitStock(event) {
    event.preventDefault(); 
    let payload = {
        date: document.getElementById('stkDate').value,
        fundType: document.getElementById('stkFund').value,
        item: document.getElementById('stkItem').value,
        vendor: document.getElementById('stkVendor').value,
        inQty: parseFloat(document.getElementById('stkIn').value) || 0,
        outQty: parseFloat(document.getElementById('stkOut').value) || 0,
        balQty: parseFloat(document.getElementById('stkBal').value) || 0,
        udise: currentSchool.udise
    };
    processRegisterSubmit('btnSaveStock', 'saveStockEntry', payload, 'modalStock');
}

function submitDeadstock(event) {
    event.preventDefault();
    let payload = {
        date: document.getElementById('dsDate').value,
        price: parseFloat(document.getElementById('dsPrice').value) || 0,
        item: document.getElementById('dsItem').value,
        vendor: document.getElementById('dsVendor').value,
        status: document.getElementById('dsStatus').value,
        remarks: document.getElementById('dsRemarks').value,
        udise: currentSchool.udise
    };
    processRegisterSubmit('btnSaveDeadstock', 'saveDeadstockEntry', payload, 'modalDeadstock');
}

function submitMeeting(event) {
    event.preventDefault();
    let payload = {
        date: document.getElementById('mtgDate').value,
        president: document.getElementById('mtgPresident').value,
        agenda: document.getElementById('mtgAgenda').value,
        resolution: document.getElementById('mtgResolution').value,
        status: document.getElementById('mtgStatus').value,
        udise: currentSchool.udise
    };
    processRegisterSubmit('btnSaveMeeting', 'saveMeetingLog', payload, 'modalMeeting');
}

async function processRegisterSubmit(btnId, serverFunc, payload, modalId) {
    let btn = document.getElementById(btnId);
    let origText = btn.innerHTML;
    
    if (!navigator.onLine) {
        let queue = await localforage.getItem('sna_offline_queue') || [];
        queue.push({ func: serverFunc, data: payload, timestamp: Date.now() });
        await localforage.setItem('sna_offline_queue', queue);
        
        closeRegisterModal(modalId);
        Toast.fire({ icon: 'info', title: 'તમે ઑફલાઇન છો. ડેટા સેવ થઈ ગયો છે અને નેટવર્ક આવતા જ સિંક થઈ જશે.' });
        return;
    }

    btn.innerHTML = '<i data-feather="loader" class="animate-spin w-4 h-4 inline"></i> સેવ થાય છે...';
    btn.disabled = true;
    if(typeof feather !== 'undefined') feather.replace();

    google.script.run
        .withSuccessHandler(res => {
            btn.innerHTML = origText;
            btn.disabled = false;
            if(res.success) {
                Toast.fire({ icon: 'success', title: res.message });
                closeRegisterModal(modalId);
                if(typeof loadOfficeRegistersData === 'function') loadOfficeRegistersData(currentSchool.udise);
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        })
        .withFailureHandler(err => {
            btn.innerHTML = origText;
            btn.disabled = false;
            Swal.fire('Error', err.message, 'error');
        })
        [serverFunc](payload);
}

window.addEventListener('online', async function() {
    let queue = await localforage.getItem('sna_offline_queue') || [];
    if (queue.length === 0) return;

    Toast.fire({ icon: 'info', title: 'ઇન્ટરનેટ કનેક્ટ થયું! ઑફલાઇન ડેટા સિંક થઈ રહ્યો છે...' });

    let batchData = queue.map(item => {
        item.data.last_updated_timestamp = item.timestamp || Date.now(); 
        return item;
    });

    google.script.run
        .withSuccessHandler(async (res) => {
            if(res.success) {
                await localforage.removeItem('sna_offline_queue');
                Toast.fire({ icon: 'success', title: 'બધો ઑફલાઇન ડેટા (Batch) સફળતાપૂર્વક સિંક થઈ ગયો છે!' });
                if(typeof loadOfficeRegistersData === 'function') loadOfficeRegistersData(currentSchool.udise);
            } else {
                Swal.fire('Sync Error', 'Batch Sync માં એરર આવી: ' + res.message, 'error');
            }
        })
        .withFailureHandler(err => {
            console.error("Batch Sync Error:", err);
            Toast.fire({ icon: 'error', title: 'સિંક નિષ્ફળ ગયું, નેટવર્ક સ્ટેબલ થવા પર ફરી પ્રયાસ થશે.' });
        })
        .processOfflineBatchSync(batchData); 
});

let registersDataCache = { meetings: [], stock: [], deadstock: [], quotations: [], form27: [] };

function loadOfficeRegistersData(udise) {
    let uCode = udise || currentSchool.udise;
    if (!uCode) return;

    ['tbody-meetings', 'tbody-stock', 'tbody-deadstock', 'tbody-quotations', 'tbody-form27'].forEach(id => {
        let el = document.getElementById(id);
        if(el) el.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-slate-400 font-bold"><i data-feather="loader" class="animate-spin inline w-5 h-5"></i> ડેટા ગુગલ શીટમાંથી લોડ થઈ રહ્યો છે...</td></tr>`;
    });
    if(typeof feather !== 'undefined') feather.replace();

    google.script.run
        .withSuccessHandler(res => {
            if(res.success) {
                registersDataCache = res.data;
                renderOfficeRegistersUI(); 
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        })
        .withFailureHandler(err => console.error(err))
        .getOfficeRegistersData(uCode);
}

function renderOfficeRegistersUI() {
    
    let stkBody = document.getElementById('tbody-stock');
    if(stkBody) {
        stkBody.innerHTML = '';
        if(!registersDataCache.stock || registersDataCache.stock.length === 0) {
            stkBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400 font-bold">કોઈ સ્ટોક એન્ટ્રી જોવા મળી નથી.</td></tr>`;
        } else {
            registersDataCache.stock.slice().reverse().forEach((r, i) => {
                stkBody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td class="p-3 text-center font-bold text-slate-500">${i+1}</td>
                    <td class="p-3 font-bold text-slate-700">${escapeHtml(r.date)}</td>
                    <td class="p-3 text-left font-bold text-slate-800">${escapeHtml(r.item)}<br><span class="text-[10px] text-slate-500">${escapeHtml(r.vendor)} (${escapeHtml(r.fundType)})</span></td>
                    <td class="p-3 text-center font-black text-emerald-600">${r.inQty}</td>
                    <td class="p-3 text-center font-black text-rose-600">${r.outQty}</td>
                    <td class="p-3 text-center font-black text-indigo-700">${r.balQty}</td>
                    <td class="p-3 text-center no-print flex justify-center gap-1">
                        <button onclick="editRegEntry('stock', '${r.id}')" class="text-indigo-500 hover:text-white hover:bg-indigo-500 bg-indigo-50 p-1.5 rounded-lg transition shadow-sm" title="એડિટ કરો"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteRegEntry('STOCK_MASTER', '${r.id}')" class="text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 p-1.5 rounded-lg transition shadow-sm" title="ડિલીટ કરો"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
            });
        }
    }

    let dsBody = document.getElementById('tbody-deadstock');
    if(dsBody) {
        dsBody.innerHTML = '';
        if(!registersDataCache.deadstock || registersDataCache.deadstock.length === 0) {
            dsBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400 font-bold">કોઈ ડેડસ્ટોક એન્ટ્રી જોવા મળી નથી.</td></tr>`;
        } else {
            registersDataCache.deadstock.slice().reverse().forEach((r, i) => {
                dsBody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td class="p-3 text-center font-bold text-slate-500">${i+1}</td>
                    <td class="p-3 font-bold text-slate-700">${escapeHtml(r.date)}</td>
                    <td class="p-3 text-left font-bold text-slate-800">${escapeHtml(r.item)}</td>
                    <td class="p-3 text-left text-xs font-bold text-slate-600">${escapeHtml(r.vendor)}</td>
                    <td class="p-3 text-right font-black text-slate-800">₹ ${formatINR(r.price)}</td>
                    <td class="p-3 text-center"><span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-indigo-200">${escapeHtml(r.status)}</span></td>
                    <td class="p-3 text-center no-print flex justify-center gap-1">
                        <button onclick="editRegEntry('deadstock', '${r.id}')" class="text-indigo-500 hover:text-white hover:bg-indigo-500 bg-indigo-50 p-1.5 rounded-lg transition shadow-sm" title="એડિટ કરો"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteRegEntry('DEADSTOCK_MASTER', '${r.id}')" class="text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 p-1.5 rounded-lg transition shadow-sm" title="ડિલીટ કરો"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
            });
        }
    }

    let mtgBody = document.getElementById('tbody-meetings');
    if(mtgBody) {
        mtgBody.innerHTML = '';
        if(!registersDataCache.meetings || registersDataCache.meetings.length === 0) {
            mtgBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400 font-bold">કોઈ ઠરાવ/મીટિંગ નોંધાયેલ નથી.</td></tr>`;
        } else {
            registersDataCache.meetings.slice().reverse().forEach((r, i) => {
                mtgBody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td class="p-3 text-center font-bold text-slate-500">${i+1}</td>
                    <td class="p-3 font-bold text-slate-700">${escapeHtml(r.date)}</td>
                    <td class="p-3 text-left font-bold text-slate-800">${escapeHtml(r.president)}</td>
                    <td class="p-3 text-left text-xs font-medium text-slate-600">${escapeHtml(r.agenda).replace(/\n/g, '<br>')}</td>
                    <td class="p-3 text-left text-xs font-medium text-slate-600">${escapeHtml(r.resolution).replace(/\n/g, '<br>')}</td>
                    <td class="p-3 text-center"><span class="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-200">${escapeHtml(r.status)}</span></td>
                    <td class="p-3 text-center no-print flex justify-center gap-1">
                        <button onclick="editRegEntry('meetings', '${r.id}')" class="text-indigo-500 hover:text-white hover:bg-indigo-500 bg-indigo-50 p-1.5 rounded-lg transition shadow-sm" title="એડિટ કરો"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteRegEntry('MEETING_LOGS', '${r.id}')" class="text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 p-1.5 rounded-lg transition shadow-sm" title="ડિલીટ કરો"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
            });
        }
    }

    let qBody = document.getElementById('tbody-quotations');
    if(qBody) {
        qBody.innerHTML = '';
        if(!registersDataCache.quotations || registersDataCache.quotations.length === 0) {
            qBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-bold">કોઈ ખરીદી પ્રક્રિયા નોંધાયેલ નથી.</td></tr>`;
        } else {
            registersDataCache.quotations.slice().reverse().forEach((r, i) => {
                qBody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td class="p-3 text-center font-bold text-slate-500">${i+1}</td>
                    <td class="p-3 font-bold text-slate-700">${escapeHtml(r.date)}</td>
                    <td class="p-3 text-left font-bold text-slate-800">${escapeHtml(r.item)}</td>
                    <td class="p-3 text-left font-bold text-emerald-700">${escapeHtml(r.l1Name)} <span class="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded ml-1">L1</span></td>
                    <td class="p-3 text-right font-black text-slate-800">₹ ${formatINR(r.l1Price)}</td>
                    <td class="p-3 text-center no-print">
                        <button onclick="deleteRegEntry('QUOTATION_LOGS', '${r.id}')" class="text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 p-1.5 rounded-lg transition shadow-sm" title="ડિલીટ કરો"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
            });
        }
    }

    let fBody = document.getElementById('tbody-form27');
    if(fBody) {
        fBody.innerHTML = '';
        if(!registersDataCache.form27 || registersDataCache.form27.length === 0) {
            fBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-bold">કોઈ મજૂર પત્રક નોંધાયેલ નથી.</td></tr>`;
        } else {
            registersDataCache.form27.slice().reverse().forEach((r, i) => {
                fBody.innerHTML += `<tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td class="p-3 text-center font-bold text-slate-500">${i+1}</td>
                    <td class="p-3 font-bold text-slate-700">${escapeHtml(r.date)}</td>
                    <td class="p-3 text-left font-bold text-indigo-700">${escapeHtml(r.month)}</td>
                    <td class="p-3 text-left text-sm font-bold text-slate-600">${escapeHtml(r.work)}</td>
                    <td class="p-3 text-right font-black text-rose-600">₹ ${formatINR(r.total)}</td>
                    <td class="p-3 text-center no-print">
                        <button onclick="deleteRegEntry('LABOR_LOGS', '${r.id}')" class="text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 p-1.5 rounded-lg transition shadow-sm" title="ડિલીટ કરો"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>`;
            });
        }
    }

    if(typeof feather !== 'undefined') feather.replace();
}

function deleteRegEntry(sheetName, id) {
    Swal.fire({
        title: 'ખાતરી કરો',
        text: "શું તમે ખરેખર આ રેકોર્ડ કાયમ માટે કાઢી નાખવા માંગો છો?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'હા, ડીલીટ કરો!',
        cancelButtonText: 'રદ કરો'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
            
            google.script.run
                .withSuccessHandler(res => {
                    if(res.success) {
                        Toast.fire({ icon: 'success', title: res.message });
                        loadOfficeRegistersData(currentSchool.udise); 
                    } else {
                        Swal.fire('Error', res.message, 'error');
                    }
                })
                .withFailureHandler(err => Swal.fire('Error', err.message, 'error'))
                .deleteRegisterData(sheetName, id);
        }
    });
}

let currentEditRegId = null;

function editRegEntry(type, id) {
    currentEditRegId = id; 
    
    if(type === 'stock') {
        let r = registersDataCache.stock.find(x => x.id === id);
        if(r) {
            document.getElementById('stkDate').value = r.date.split('-').reverse().join('-'); 
            document.getElementById('stkFund').value = r.fundType;
            document.getElementById('stkItem').value = r.item;
            document.getElementById('stkVendor').value = r.vendor;
            document.getElementById('stkIn').value = r.inQty;
            document.getElementById('stkOut').value = r.outQty;
            document.getElementById('stkBal').value = r.balQty;
            document.getElementById('modalStock').classList.remove('hidden');
        }
    } else if(type === 'deadstock') {
        let r = registersDataCache.deadstock.find(x => x.id === id);
        if(r) {
            document.getElementById('dsDate').value = r.date.split('-').reverse().join('-');
            document.getElementById('dsPrice').value = r.price;
            document.getElementById('dsItem').value = r.item;
            document.getElementById('dsVendor').value = r.vendor;
            document.getElementById('dsStatus').value = r.status;
            document.getElementById('dsRemarks').value = r.remarks;
            document.getElementById('modalDeadstock').classList.remove('hidden');
        }
    } else if(type === 'meetings') {
        let r = registersDataCache.meetings.find(x => x.id === id);
        if(r) {
            document.getElementById('mtgDate').value = r.date.split('-').reverse().join('-');
            document.getElementById('mtgPresident').value = r.president;
            document.getElementById('mtgAgenda').value = r.agenda.replace(/<br>/g, '\n');
            document.getElementById('mtgResolution').value = r.resolution.replace(/<br>/g, '\n');
            document.getElementById('mtgStatus').value = r.status;
            document.getElementById('modalMeeting').classList.remove('hidden');
        }
    }
}

let spotlightActive = false;
let spotlightSelectedIndex = -1;

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSpotlight();
    }
    if (e.key === 'Escape' && spotlightActive) {
        toggleSpotlight(false);
    }
    if (spotlightActive) {
        const results = document.querySelectorAll('.spotlight-item');
        if (results.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                spotlightSelectedIndex = (spotlightSelectedIndex + 1) % results.length;
                updateSpotlightSelection(results);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                spotlightSelectedIndex = (spotlightSelectedIndex - 1 + results.length) % results.length;
                updateSpotlightSelection(results);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (spotlightSelectedIndex >= 0 && results[spotlightSelectedIndex]) {
                    results[spotlightSelectedIndex].click();
                } else if (results.length > 0) {
                    results[0].click();
                }
            }
        }
    }
});

function toggleSpotlight(forceOpen = null) {
    const overlay = document.getElementById('spotlightOverlay');
    const input = document.getElementById('spotlightInput');
    
    if (!overlay || !input) return;

    if (forceOpen === false || spotlightActive) {
        overlay.classList.add('hidden');
        spotlightActive = false;
    } else {
        overlay.classList.remove('hidden');
        input.value = '';
        document.getElementById('spotlightResults').innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">તમે શું શોધવા માંગો છો?<br><span class="text-xs font-medium">ટાઈપ કરો: કેશબુક, Cashbook, Form 27, મજૂર...</span></div>`;
        setTimeout(() => input.focus(), 50);
        spotlightActive = true;
        spotlightSelectedIndex = -1;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let spotlightInput = document.getElementById('spotlightInput');
    if (spotlightInput) {
        spotlightInput.addEventListener('input', function(e) {
            let q = e.target.value.toLowerCase().trim();
            let resultsBox = document.getElementById('spotlightResults');
            spotlightSelectedIndex = -1;
            
            console.log("🔍 [Spotlight Debug] User typed:", q);

            if (!resultsBox) return;

            if (!q) {
                resultsBox.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">તમે શું શોધવા માંગો છો?<br><span class="text-xs font-medium">ટાઈપ કરો: કેશબુક, Cashbook, Form 27, મજૂર...</span></div>`;
                return;
            }

            let matches = [];
            const navCommands = [
                { keywords: ['dashboard', 'home', 'ડેશબોર્ડ', 'હોમ', 'મુખ્ય પાનું'], title: 'SNA ડેશબોર્ડ (Home)', icon: 'pie-chart', type: 'Navigation', action: "switchTab('dashboard')" },
                { keywords: ['fund', 'order', 'ઓર્ડર', 'ફંડ', 'વિતરણ'], title: 'ફંડ વિતરણ (ઓર્ડર બનાવો)', icon: 'file-plus', type: 'Action', action: "switchTab('fund')" },
                { keywords: ['voucher', 'print', 'વાઉચર', 'પ્રિન્ટ'], title: 'નવું વાઉચર પ્રિન્ટ કરો', icon: 'printer', type: 'Action', action: "switchTab('voucher')" },
                { keywords: ['account', 'report', 'એકાઉન્ટ', 'રિપોર્ટ', 'હિસાબ'], title: 'એકાઉન્ટિંગ રિપોર્ટ્સ', icon: 'book-open', type: 'Navigation', action: "switchTab('accounting')" },
                { keywords: ['cashbook', 'cash', 'રોજમેળ', 'કેશબુક', 'આવક જાવક'], title: 'Cashbook (કેશબુક / રોજમેળ)', icon: 'book', type: 'Report', action: "switchTab('accounting'); setTimeout(()=>selectReport('cashbook', document.querySelector('.report-card')), 200);" },
                { keywords: ['khatavahi', 'ledger', 'ખાતાવહી', 'વર્ગીકરણ', 'હેડ'], title: 'Khatavahi (ખાતાવહી / વર્ગીકરણ)', icon: 'book', type: 'Report', action: "switchTab('accounting'); setTimeout(()=>selectReport('ledger', document.querySelectorAll('.report-card')[1]), 200);" },
                { keywords: ['patrak', 'c', 'bill', 'પત્રક', 'બિલ રજીસ્ટર'], title: 'Patrak C (પત્રક C / બિલ રજીસ્ટર)', icon: 'file-text', type: 'Report', action: "switchTab('accounting'); setTimeout(()=>selectReport('patrak-c', document.querySelectorAll('.report-card')[2]), 200);" },
                { keywords: ['register', 'office', 'દફ્તર', 'શાળા દફ્તર'], title: 'શાળા દફ્તર (Office Registers)', icon: 'archive', type: 'Navigation', action: "switchTab('registers')" },
                { keywords: ['smc', 'meeting', 'resolution', 'મીટિંગ', 'ઠરાવ'], title: 'SMC મીટિંગ / ઠરાવ બુક', icon: 'users', type: 'Register', action: "switchTab('registers'); setTimeout(()=>switchRegisterView('meetings'), 200);" },
                { keywords: ['stock', 'સ્ટોક', 'સામાન'], title: 'સ્ટોક રજીસ્ટર', icon: 'box', type: 'Register', action: "switchTab('registers'); setTimeout(()=>switchRegisterView('stock'), 200);" },
                { keywords: ['deadstock', 'ડેડસ્ટોક', 'મિલકત', 'સાધન'], title: 'ડેડસ્ટોક રજીસ્ટર', icon: 'monitor', type: 'Register', action: "switchTab('registers'); setTimeout(()=>switchRegisterView('deadstock'), 200);" },
                { keywords: ['quotation', 'l1', 'ખરીદી', 'ભાવપત્રક', 'વર્ક ઓર્ડર'], title: 'ખરીદી પ્રક્રિયા (Quotations / L1)', icon: 'shopping-cart', type: 'Register', action: "switchTab('registers'); setTimeout(()=>switchRegisterView('quotations'), 200);" },
                { keywords: ['form 27', 'labor', 'majur', 'મજૂર', 'હાજરી', 'દહાડિયા'], title: 'મજૂર હાજરી પત્રક (Form 27)', icon: 'hard-hat', type: 'Register', action: "switchTab('registers'); setTimeout(()=>switchRegisterView('form27'), 200);" },
                { keywords: ['vendor', 'party', 'વેન્ડર', 'પાર્ટી', 'ડીરેક્ટરી'], title: 'વેન્ડર મેનેજમેન્ટ (Vendor Directory)', icon: 'users', type: 'Navigation', action: "switchTab('vendors')" },
                { keywords: ['setting', 'bank', 'logo', 'સેટિંગ્સ', 'બેંક', 'લોગો'], title: 'માસ્ટર સેટિંગ્સ (Bank & Logos)', icon: 'settings', type: 'Settings', action: "switchTab('settings')" },
                { keywords: ['logout', 'lock', 'લોગઆઉટ', 'લોક', 'બંધ કરો'], title: 'સુરક્ષિત લોગઆઉટ (Logout/Lock)', icon: 'lock', type: 'System', action: "lockApp()" }
            ];

            navCommands.forEach(cmd => {
                let titleMatch = cmd.title.toLowerCase().includes(q);
                let keywordMatch = cmd.keywords.some(kw => kw.toLowerCase().includes(q));
                if (titleMatch || keywordMatch) {
                    matches.push({ ...cmd, bg: 'bg-indigo-50 text-indigo-600', iconColor: 'text-indigo-500' });
                }
            });

            if (matches.length === 0) {
                resultsBox.innerHTML = `<div class="p-6 text-center text-slate-400 font-bold">No results found for "${q}"</div>`;
                return;
            }

            matches = matches.slice(0, 10);
            let html = '';
            matches.forEach((m) => {
                html += `
                <div class="spotlight-item p-3.5 border-b border-slate-100 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition group" onclick="toggleSpotlight(false); ${m.action}">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            <span class="font-bold text-sm">📌</span>
                        </div>
                        <div>
                            <div class="font-bold text-slate-800 text-sm leading-tight">${m.title}</div>
                            ${m.desc ? `<div class="text-[10px] font-bold text-slate-400 mt-0.5">${m.desc}</div>` : ''}
                        </div>
                    </div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">${m.type}</div>
                </div>`;
            });
            resultsBox.innerHTML = html;
        });
    }
});

function updateSpotlightSelection(results) {
    results.forEach((el, index) => {
        if (index === spotlightSelectedIndex) {
            el.classList.add('bg-slate-200');
            el.classList.remove('hover:bg-slate-100');
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            el.classList.remove('bg-slate-200');
            el.classList.add('hover:bg-slate-100');
        }
    });
}

window.startSmartTutorial = function(forceStart = false) {
    let tourKey = 'sparshTourSeen_' + (typeof currentSchool !== 'undefined' && currentSchool.udise ? currentSchool.udise : 'unknown');
    
    if (!forceStart && localStorage.getItem(tourKey) === "TRUE") {
        return; 
    }

    if (!window.driver || !window.driver.js || !window.driver.js.driver) {
        console.warn("Driver.js is not loaded yet.");
        return;
    }

    if (!document.getElementById('driver-supreme-theme')) {
        const style = document.createElement('style');
        style.id = 'driver-supreme-theme';
        style.innerHTML = `
          body .driver-popover, body .driver-popover * {
              font-family: 'Anek Gujarati', 'Inter', sans-serif !important;
          }
          body .driver-popover {
              border-radius: 1.5rem !important;
              border: 1px solid rgba(99, 102, 241, 0.3) !important;
              box-shadow: 0 35px 60px -15px rgba(79, 70, 229, 0.45), 0 0 0 1.5px rgba(255, 255, 255, 0.8) inset !important;
              padding: 26px !important;
              background: rgba(255, 255, 255, 0.98) !important;
              backdrop-filter: blur(25px) !important;
              max-width: 440px !important;
          }
          body .driver-popover-title {
              font-size: 22px !important; font-weight: 900 !important; color: #0f172a !important;
              margin-bottom: 14px !important; display: flex !important; align-items: center !important; gap: 10px !important;
              border-bottom: 2px dashed #e2e8f0 !important; padding-bottom: 12px !important;
          }
          body .driver-popover-description {
              font-size: 15.5px !important; font-weight: 600 !important; color: #334155 !important; line-height: 1.8 !important;
          }
          body .driver-popover-description b { color: #4f46e5 !important; font-weight: 900 !important; }
          body .driver-popover-description ul { margin-top: 10px !important; padding-left: 0 !important; list-style-type: none !important; color: #475569 !important; }
          body .driver-popover-description li { margin-bottom: 8px !important; position: relative; padding-left: 22px !important; }
          body .driver-popover-description li::before { content: "🎯"; position: absolute; left: 0; top: 1px; font-size: 13px; }
          body .driver-popover-footer { margin-top: 26px !important; }
          body .driver-popover-footer button {
              font-weight: 900 !important; border-radius: 0.75rem !important; padding: 12px 24px !important;
              font-size: 15px !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          body .driver-popover-next-btn {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important; color: white !important;
              border: none !important; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4) !important; text-shadow: none !important;
          }
          body .driver-popover-next-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.6) !important; }
          body .driver-popover-prev-btn { color: #64748b !important; background: #f8fafc !important; border: 1px solid #cbd5e1 !important; text-shadow: none !important; }
          body .driver-popover-prev-btn:hover { background: #f1f5f9 !important; color: #0f172a !important; border-color: #94a3b8 !important; }
          body .driver-popover-close-btn { color: #94a3b8 !important; top: 16px !important; right: 16px !important; transition: all 0.3s ease !important; }
          body .driver-popover-close-btn:hover { color: #e11d48 !important; transform: rotate(90deg) scale(1.2) !important; }
          body .driver-popover-progress-text { font-family: 'Inter', sans-serif !important; font-weight: 900 !important; color: #64748b !important; font-size: 14px !important; }
          path.driver-overlay-path { fill: rgba(15, 23, 42, 0.75) !important; }
        `;
        document.head.appendChild(style);
    }

    const driver = window.driver.js.driver;
    
    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        doneBtnText: 'સમાપ્ત કરો 🚀',
        nextBtnText: 'આગળ સમજો →',
        prevBtnText: '← પાછળ',
        steps: [
            { 
                element: '#globalSchemeSelector', 
                popover: { title: '📌 ૧. ગ્લોબલ સ્કીમ સિલેક્ટર', description: 'અહીંથી તમે <b>PM SHRI</b> કે <b>SSA</b> પસંદ કરશો, એટલે આખી સિસ્ટમનો ડેટા, બજેટ હેડ્સ અને રિપોર્ટ્સ તે મુજબ ઓટોમેટિક બદલાઈ જશે.', side: "bottom", align: 'start' },
                onHighlightStarted: () => { switchTab('dashboard'); window.scrollTo(0,0); }
            },
            { 
                element: 'button[onclick="executeMasterSync()"]', 
                popover: { title: '🔄 ૨. માસ્ટર સિંક (Live Data)', description: 'જો પોર્ટલ પર નવો ખર્ચ કે ગ્રાન્ટ જમા થઈ હોય, તો આ બટન દબાવવાથી <b>1 જ સેકન્ડમાં</b> તમામ રિપોર્ટ્સ અને ખાતાવહી અપડેટ થઈ જશે.', side: "bottom", align: 'end' } 
            },
            { 
                element: 'button[onclick="lockApp()"]', 
                popover: { title: '🔒 ૩. સિક્યોર સ્ક્રીન લોક', description: 'બેંક જેવી સિક્યોરિટી! જ્યારે તમે પીસી પરથી ઉભા થાવ ત્યારે આ બટન દબાવીને સ્ક્રીન લોક કરી શકો છો (ફક્ત પિન નાખીને પાછા આવી શકાશે).', side: "bottom", align: 'end' } 
            },
            { 
                element: '#extensionSetupCard', 
                popover: { title: '⚡ ૪. 1-Click એક્સટેન્શન', description: 'સાયબર ટ્રેઝરી (PFMS) માં મેન્યુઅલ ટાઈપિંગ બંધ! અહીંથી આપણું ક્રોમ એક્સટેન્શન કનેક્ટ કરો અને ઓટોમેશન શરૂ કરો.', side: "bottom", align: 'center' },
                onHighlightStarted: () => { window.scrollTo(0, 50); }
            },
            { 
                element: '#dashFundFilter', 
                popover: { title: '📊 ૫. સ્માર્ટ ફંડ ફિલ્ટર', description: 'તમારે માત્ર મૂડી (Capital) ગ્રાન્ટ જોવી છે કે મહેસૂલી (Recurring)? અહીંથી ફિલ્ટર કરતા જ લાઈવ બેલેન્સના ચાર્ટ્સ બદલાઈ જશે.', side: "bottom", align: 'end' } 
            },
            { 
                element: 'button[onclick="openCyberTreasuryAutoSync()"]', 
                popover: { title: '🤖 ૬. PFMS Auto Sync', description: 'આ મેજિક બટન દબાવતા જ સિસ્ટમ ટ્રેઝરી પોર્ટલ પર જઈને તમારા પાસ/ફેઈલ થયેલા બીલનો રિપોર્ટ <b>જાતે જ 10 સેકન્ડમાં</b> અપડેટ કરી લેશે!', side: "bottom", align: 'end' } 
            },
            { 
                element: '.grid.grid-cols-1.md\\:grid-cols-3', 
                popover: { title: '💰 ૭. ગ્રાન્ટ અને બેલેન્સ કાર્ડ્સ', description: 'આ 3 મેઈન કાર્ડ્સમાં તમને: <ul><li><b>કુલ મંજુર ગ્રાન્ટ</b> (હેડ વાઈઝ બ્રેકડાઉન સાથે)</li><li><b>કુલ લાઈવ ખર્ચ</b> (Central અને State હિસ્સા સાથે)</li><li><b>લાઈવ અવેલેબલ બેલેન્સ</b> (60-40 ના ભાગ સાથે) જોવા મળશે.</li></ul>', side: "bottom", align: 'center' },
                onHighlightStarted: () => { window.scrollTo(0, 150); }
            },
            { 
                element: '.grid.grid-cols-1.md\\:grid-cols-4', 
                popover: { title: '🏦 ૮. ટ્રેઝરી PFMS રિપોર્ટ', description: 'ટ્રેઝરીમાં મોકલેલા બિલોનું શું થયું? <ul><li>કેટલા રૂપિયાના બિલ <b>SUCCESS</b> થયા?</li><li>કેટલા બિલ <b>PENDING</b> છે?</li><li>કોઈ બિલ <b>REJECT</b> થયું છે?</li></ul>તેનું લાઈવ સ્ટેટસ અહીં મળશે.', side: "top", align: 'center' },
                onHighlightStarted: () => { window.scrollTo({ top: document.body.scrollHeight / 3, behavior: 'smooth' }); }
            },
            { 
                element: '.grid.grid-cols-1.lg\\:grid-cols-2', 
                popover: { title: '📉 ૯. એનાલિટિક્સ ચાર્ટ્સ', description: 'કયા હેડમાં કેટલો ખર્ચ થયો (Pie Chart) અને કયા મહિનામાં કેટલો ખર્ચ થયો (Bar Chart) તેનું વિઝ્યુઅલ એનાલિસિસ.', side: "top", align: 'center' } 
            },
            { 
                element: '#dt-fund', 
                popover: { title: '📝 ૧૦. નવો વર્ક ઓર્ડર (Fund)', description: 'કોઈપણ ખર્ચનું પેમેન્ટ કરવા માટે નવો આદેશ બનાવવા અહીં ક્લિક કરો. ચાલો અંદર જઈએ...', side: "right", align: 'center' },
                onHighlightStarted: () => { 
                    let sidebarNav = document.querySelector('#appSidebar nav');
                    if(sidebarNav) sidebarNav.scrollTop = 0; window.scrollTo(0,0);
                } 
            },
            { 
                element: '#orderType', 
                popover: { title: '🏷️ ૧૧. ઓર્ડરનો પ્રકાર & હેડ્સ', description: 'અહીંથી તમારો ખર્ચ Recurring (મહેસૂલી) છે કે Non-Recurring (મૂડી) તે પસંદ કરો. સિસ્ટમ જાતે જ સ્કીમ મુજબ હેડ્સનું લિસ્ટ ફિલ્ટર કરી દેશે.', side: "bottom", align: 'start' },
                onHighlightStarted: () => { switchTab('fund'); window.scrollTo(0,0); }
            },
            { 
                element: '#dt-voucher', 
                popover: { title: '🧾 ૧૨. પ્રો-વાઉચર પ્રિન્ટ', description: 'જો વેન્ડર પાસે પાકું બિલ ન હોય, તો અહીંથી ફટાફટ નવું પ્રોફેશનલ વાઉચર પ્રિન્ટ કરીને સહી લઈ શકાશે.', side: "right", align: 'center' },
                onHighlightStarted: () => { switchTab('voucher'); }
            },
            { 
                element: '#dt-vendors', 
                popover: { title: '👥 ૧૩. વેન્ડર ડિરેક્ટરી', description: 'તમારી શાળાના તમામ વેન્ડર્સ, તેમના બેંક એકાઉન્ટ અને IFSC ની યાદી અહીં જોવા મળશે. તમે અહીંથી <b>નવો વેન્ડર</b> પણ ઉમેરી શકો છો.', side: "right", align: 'center' },
                onHighlightStarted: () => { switchTab('vendors'); }
            },
            { 
                element: '#dt-accounting', 
                popover: { title: '📒 ૧૪. સ્માર્ટ એકાઉન્ટિંગ', description: 'હવે આપણે એકાઉન્ટિંગ સેક્શનની અંદર જઈને તેના પાવરફુલ ફીચર્સ સમજીશું. (સિસ્ટમ જાતે જ ઓપન કરશે)', side: "right", align: 'center' },
                onHighlightStarted: () => { 
                    let sidebarNav = document.querySelector('#appSidebar nav');
                    if(sidebarNav) sidebarNav.scrollTop = 150; 
                }
            },
            { 
                element: '#tab-accounting .flex.gap-3', 
                popover: { title: '📑 ૧૫. તમામ ૯ રિપોર્ટ્સ (1-Click)', description: '<b>કોઈ મેન્યુઅલ ટાઈપિંગ નહિ!</b> બસ અહીંથી રિપોર્ટનું નામ પસંદ કરો: <ul><li>કેશબુક (રોકડમેળ) અને ખાતાવહી</li><li>પત્રક-C અને બિલ રજીસ્ટર</li><li>પાસબુક (E-Payment Ledger)</li><li>ગ્રાન્ટ રજીસ્ટર & ગ્રાન્ટ સર્ટિફિકેટ (P9/P10)</li></ul>', side: "bottom", align: 'start' },
                onHighlightStarted: () => { switchTab('accounting'); window.scrollTo(0,0); }
            },
            { 
                element: '#monthFilterChips', 
                popover: { title: '📅 ૧૬. મન્થલી ફિલ્ટર (Months)', description: 'માત્ર બે-ત્રણ મહિનાની કેશબુક કે ખાતાવહી પ્રિન્ટ કરવી છે? અહીંથી મહિના સિલેક્ટ કરો એટલે ડેટા ઓટોમેટિક શોર્ટ થઈ જશે.', side: "bottom", align: 'start' }
            },
            { 
                element: 'button[onclick="openManualEntryModal()"]', 
                popover: { title: '🕰️ ૧૭. જૂની SNA એન્ટ્રી', description: 'જો તમારો કોઈ જૂનો પેન્ડિંગ ઓર્ડર હોય (જે પોર્ટલ પર હજુ સિંક ન થયો હોય), તો તેને અહીંથી <b>મેન્યુઅલી</b> સિસ્ટમમાં ચડાવી શકો છો.', side: "bottom", align: 'end' }
            },
            { 
                element: '#dt-database', 
                popover: { title: '🗄️ ૧૮. PFMS લાઈવ ડેટાબેઝ', description: 'આ મોડ્યુલ ખાસ છે! આખું ટ્રેઝરી પોર્ટલ હવે તમારી સિસ્ટમમાં. ચાલો અંદર જોઈએ...', side: "right", align: 'center' },
            },
            { 
                element: '#tab-database .flex.gap-2', 
                popover: { title: '💳 ૧૯. E-Payment & Claims', description: 'પોર્ટલના તમામ કાચા ડેટા (Claims, Mother Sanctions, Transactions) તમે અહીં જોઈ શકશો અને તેને સીધા <b>Excel માં ડાઉનલોડ</b> કરી શકશો.', side: "bottom", align: 'start' },
                onHighlightStarted: () => { switchTab('database'); window.scrollTo(0,0); }
            },
            { 
                element: '#dt-registers', 
                popover: { title: '📚 ૨૦. શાળા દફ્તર (Registers)', description: 'પેપરલેસ વહીવટ તરફ એક મોટું કદમ! ચાલો શાળા દફ્તરની અંદર જઈએ...', side: "right", align: 'center' },
                onHighlightStarted: () => { 
                    let sidebarNav = document.querySelector('#appSidebar nav');
                    if(sidebarNav) sidebarNav.scrollTop = sidebarNav.scrollHeight - 100; 
                }
            },
            { 
                element: '#tab-registers .flex.gap-3', 
                popover: { title: '✍️ ૨૧. ડિજિટલ રજીસ્ટર્સ', description: 'હવે જાડી બુકો નિભાવવાની જરૂર નથી!<ul><li><b>SMC ઠરાવ:</b> મીટિંગની નોંધ અહીં જ કરો.</li><li><b>મજૂર પત્રક (Form 27):</b> દહાડી મજૂરી માટે.</li><li><b>સ્ટોક/ડેડસ્ટોક:</b> સામાનની નોંધ.</li><li><b>તુલનાત્મક પત્રક:</b> 3 પાર્ટીના ભાવ (L1 Bidder).</li></ul>', side: "bottom", align: 'start' },
                onHighlightStarted: () => { switchTab('registers'); window.scrollTo(0,0); }
            },
            { 
                element: 'button[onclick="openNewEntryModal()"]', 
                popover: { title: '✨ ૨૨. મેજિક લિંક ફીચર', description: 'અહીંથી નવી એન્ટ્રી કરો. <b>મેજિક લિંક:</b> Form 27 કે તુલનાત્મક પત્રકમાં એન્ટ્રી કર્યા બાદ, સીધી 1 ક્લિકમાં તેનું પેમેન્ટ વાઉચર પણ બની જશે!', side: "bottom", align: 'end' }
            },
            { 
                element: '#dt-settings', 
                popover: { title: '⚙️ ૨૩. માસ્ટર સેટિંગ્સ', description: 'તમારી સિસ્ટમને કસ્ટમાઇઝ કરવા અહી જઈએ...', side: "right", align: 'center' },
                onHighlightStarted: () => { 
                    let sidebarNav = document.querySelector('#appSidebar nav');
                    if(sidebarNav) sidebarNav.scrollTop = sidebarNav.scrollHeight; 
                }
            },
            { 
                element: '#tab-settings .grid', 
                popover: { title: '🏦 ૨૪. સંપૂર્ણ કંટ્રોલ રૂમ', description: 'અહીથી તમે:<ul><li>બેંક એકાઉન્ટ વિગતો ઉમેરી શકશો.</li><li>પોતાના નવા <b>કસ્ટમ બજેટ હેડ્સ</b> બનાવી શકશો.</li><li>શાળાનો અને સ્કીમનો <b>લોગો (Logo)</b> અપલોડ કરી શકશો.</li></ul>', side: "top", align: 'center' },
                onHighlightStarted: () => { switchTab('settings'); window.scrollTo(0,0); }
            },
            { 
                element: 'button[onclick="exportDataBackup()"]', 
                popover: { title: '☁️ ૨૫. 1-Click ક્લાઉડ બેકઅપ', description: 'માત્ર એક ક્લિક કરો અને તમારો બધો ડેટા, સેટિંગ્સ અને રજીસ્ટરની માહિતી સીધી <b>Google Drive</b> માં સુરક્ષિત સેવ થઈ જશે!', side: "top", align: 'center' },
                onHighlightStarted: () => { window.scrollTo(0, 500); }
            },
            { 
                element: 'button[onclick="window.toggleAiChat()"]', 
                popover: { 
                    title: '🤖 ૨૬. SPARSH AI (બ્રહ્માસ્ત્ર)', 
                    description: '<b>સિસ્ટમનો સૌથી પાવરફુલ ભાગ!</b><br>અહીં ક્લિક કરી <b>ગુજરાતીમાં બોલીને</b> કમાન્ડ આપો. ઉ.દા: <i>"50 હજારનું બિલ છે 60-40 ગણો"</i>. AI જાતે ગણતરી કરી, TDS કાપી તમારું વાઉચર ભરી દેશે!', 
                    side: "left", align: 'center' 
                },
                onHighlightStarted: () => { switchTab('dashboard'); window.scrollTo(0,0); } 
            },
            { 
                element: 'header', 
                popover: { title: '🔍 ૨૭. સ્પોટલાઈટ સર્ચ (Ctrl+K)', description: 'સુપરફાસ્ટ સ્પીડ! તમે સિસ્ટમમાં ગમે ત્યાં હોવ, કીબોર્ડ પરથી <b>Ctrl + K</b> દબાવો અને "કેશબુક", "મજૂર" કે વેન્ડરનું નામ સર્ચ કરો! તમે ડાયરેક્ટ ત્યાં પહોંચી જશો. 🎉 <b>ટ્યુટોરીયલ પૂરું!</b>', side: "bottom", align: 'center' },
                onHighlightStarted: () => { switchTab('dashboard'); window.scrollTo(0,0); }
            }
        ],
        onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("શું તમે આ ટ્યુટોરીયલ છોડવા માંગો છો?")) {
                driverObj.destroy();
                localStorage.setItem(tourKey, "TRUE");
                
                let sidebarNav = document.querySelector('#appSidebar nav');
                if(sidebarNav) sidebarNav.scrollTop = 0;
            }
        }
    });

    driverObj.drive();
};

window.toggleDarkMode = function() {
    const htmlEl = document.documentElement;
    const icon = document.getElementById('darkModeIcon');
    
    if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        localStorage.setItem('sparshTheme', 'light');
        if(icon) { icon.setAttribute('data-feather', 'moon'); feather.replace(); }
    } else {
        htmlEl.classList.add('dark');
        localStorage.setItem('sparshTheme', 'dark');
        if(icon) { icon.setAttribute('data-feather', 'sun'); feather.replace(); }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('sparshTheme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setTimeout(() => {
            let icon = document.getElementById('darkModeIcon');
            if(icon) { icon.setAttribute('data-feather', 'sun'); feather.replace(); }
        }, 500);
    }

    setTimeout(() => {
        if(typeof window.startSmartTutorial === 'function' && document.getElementById('appShell').style.display !== 'none') {
            window.startSmartTutorial(false);
        }
    }, 2500);
});

// પ્રિન્ટ ઓપ્ટિમાઇઝેશન માટે
window.matchMedia('print').addListener(function(mql) {
    if (mql.matches) {
        document.body.classList.add('print-optimized-mode');
    } else {
        document.body.classList.remove('print-optimized-mode');
    }
});
// =========================================================================================
// 🚀 ACCOUNTING REPORTS GENERATOR (100% CRASH-PROOF & FAST)
// =========================================================================================
function generateAccountingReport() {
    const wrapper = document.getElementById('tableWrapper'); 
    if(!wrapper) return;
    
    wrapper.innerHTML = `<div class="text-center py-16"><i data-feather="loader" class="animate-spin inline w-8 h-8 mb-3 text-indigo-500"></i><br><span class="font-bold text-slate-500">રિપોર્ટ બની રહ્યો છે... કૃપા કરીને રાહ જુઓ...</span></div>`; 
    if(typeof feather !== 'undefined') feather.replace();
    
    setTimeout(() => {
        try {
            let _today = new Date(); let _cYear = _today.getFullYear(); let _cMonth = _today.getMonth() + 1;
            let _sYear = _cMonth < 4 ? _cYear - 1 : _cYear; let _eYear = _sYear + 1;
            let fyYear = `${_sYear}-${String(_eYear).slice(-2)}`;
            let openingBalDate = `01-04-${_sYear}`;
            let closingBalDate = `31-03-${_eYear}`;

            let displayData = (typeof patrakData !== 'undefined') ? patrakData : []; 
            
            if (currentReportType !== 'epayment') {
                displayData = displayData.filter(r => {
                    let s = String(r.status || "").toUpperCase();
                    return !(s.includes("REJECT") || s.includes("FAIL") || s.includes("CANCEL") || s.includes("RETURN"));
                });
            }

            let headSelect = document.getElementById('accBudgetHead'); let selectedHead = headSelect ? headSelect.value : "ALL";
            let searchInp = document.getElementById('accSearch'); let searchQ = searchInp ? searchInp.value.toLowerCase() : "";
            let selectedMonths = []; 
            document.querySelectorAll('#monthFilterChips .month-chk:checked').forEach(chk => selectedMonths.push(chk.value));

            if ((currentReportType.includes('ledger') || currentReportType.includes('epayment')) && selectedHead !== 'ALL') {
                displayData = displayData.filter(r => r.componentName === selectedHead);
            }
            
            if (selectedMonths.length < 12 && selectedMonths.length > 0) { 
                displayData = displayData.filter(r => { 
                    let parts = String(r.date || "").split('-'); 
                    let mKey = "ALL"; 
                    if(parts.length >= 2) { 
                        let mStr = parts[1].toLowerCase(); 
                        if(isNaN(mStr)) mKey = mStr.substring(0,3); 
                        else { 
                            let mNum = parseInt(mStr, 10); 
                            const mNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]; 
                            if(mNum >= 1 && mNum <= 12) mKey = mNames[mNum - 1]; 
                        } 
                    } 
                    return selectedMonths.includes(mKey); 
                }); 
            }
            
            if (searchQ) {
                displayData = displayData.filter(r => (r.vendorName||"").toLowerCase().includes(searchQ) || (r.claimNo||"").toLowerCase().includes(searchQ));
            }

            let reportEndDate = closingBalDate;
            
            // 🚀 100% CRASH-PROOF DATE FIX (જો તારીખ ન હોય તો એરર નહિ આવે)
            let validDates = displayData.map(r => String(r.date || "")).filter(d => d && d !== "-" && d.includes("-"));
            if (validDates.length > 0) {
                let maxDateStr = validDates.reduce((max, curr) => { 
                    let p1 = curr.split('-'); let p2 = max.split('-'); 
                    if(p1.length < 3 || p2.length < 3) return max;
                    return new Date(`${p1[2]}-${p1[1]}-${p1[0]}`) > new Date(`${p2[2]}-${p2[1]}-${p2[0]}`) ? curr : max; 
                }, validDates[0]);
                
                let parts = maxDateStr.split('-');
                if(parts.length === 3) {
                    let lastDay = new Date(parts[2], parseInt(parts[1]), 0).getDate(); 
                    reportEndDate = `${String(lastDay).padStart(2,'0')}-${parts[1]}-${parts[2]}`;
                }
            }

            if(displayData.length === 0) { 
                wrapper.innerHTML = `<div class="text-center py-16 font-bold text-slate-400">કોઈ ડેટા ઉપલબ્ધ નથી. (No Data Found)</div>`; 
                return; 
            }

            // 🚀 SMART SORTING (ખરાબ તારીખ હોય તો પણ નહિ અટકે)
            let uniqueDates = [...new Set(displayData.map(item => String(item.date || "-")))]; 
            uniqueDates.sort((a, b) => { 
                let pA = a.split('-'); let pB = b.split('-');
                if(pA.length < 3 || pB.length < 3) return 0;
                return new Date(`${pA[2]}-${pA[1]}-${pA[0]}`) - new Date(`${pB[2]}-${pB[1]}-${pB[0]}`); 
            });
            
            let cashbookPageMap = {}; uniqueDates.forEach((d, i) => cashbookPageMap[d] = i + 1); 
            let allHeads = [...new Set(displayData.map(r => r.componentName || "-"))].sort(); 
            let khatavahiPageMap = {}; allHeads.forEach((h, i) => khatavahiPageMap[h] = i + 1);

            let html = `
            <div class="flex flex-wrap justify-center gap-3 mb-6 no-print">
              <button onclick="prepareProfessionalPrint(false)" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all">
                <i data-feather="printer" class="w-4 h-4"></i> Print (Color)
              </button>
              <button onclick="prepareProfessionalPrint(true)" class="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all">
                <i data-feather="printer" class="w-4 h-4"></i> Print (B/W - Ink Saver)
              </button>
            </div>`;

            // 🚀 પત્રક-C (ROWS_PER_PAGE = 9)
            if (currentReportType === 'patrak-c') {
                let grandPatrakTotal = 0; displayData.forEach(r => grandPatrakTotal += (parseFloat(r.amount)||0));
                const ROWS_PER_PAGE = 9; 
                let totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE) || 1;
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-xl mb-2 text-indigo-800 tracking-wide">PFMS & SNA SPARSH બીલ રજીસ્ટર ની વિગત (પત્રક-C) (Page ${p+1}/${totalPages})</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">શાળાનું નામ : ${escapeHtml(currentSchool.name)}<br>ફંડનો પ્રકાર : SNA SPARSH</div><div class="text-right">વર્ષ : ${fyYear}</div></div></div><table class="tally-table border-2 border-slate-800 border-print w-full text-center text-sm"><thead class="bg-indigo-50 print-no-bg border-b-2 border-slate-800 border-print"><tr><th class="p-2 border-r border-slate-800 border-print">ક્રમ</th><th class="p-2 border-r border-slate-800 border-print">આદેશ / ઓર્ડર<br>ની તારીખ</th><th class="p-2 border-r border-slate-800 border-print">ચુકવણી પ્રકાર</th><th class="p-2 border-r border-slate-800 border-print">PFMS PPA NO. / Claim Number</th><th class="p-2 border-r border-slate-800 border-print">ચુકવેલ બીલ<br>ની રકમ (₹)</th><th class="p-2 border-r border-slate-800 border-print w-16">વાઉચર<br>નંબર</th><th class="p-2 border-r border-slate-800 border-print">પાર્ટીનું નામ<br>(Vendor)</th><th class="p-2 border-r border-slate-800 border-print">ગ્રાન્ટ નો હેડ</th><th class="p-2 border-print">PFMS પાસ<br>થયા તારીખ</th></tr></thead><tbody>`;
                    let chunk = displayData.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((r, i) => {
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let vch = (r.vchNo && r.vchNo !== "N/A" && r.vchNo !== "-") ? escapeHtml(r.vchNo) : globalIdx; let amt = parseFloat(r.amount) || 0;
                        let displayPfmsDate = (!r.pfmsDate || r.pfmsDate === "-") ? `<span class="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending</span>` : `<span class="text-emerald-700">${escapeHtml(r.pfmsDate)}</span>`;
                        html += `<tr class="hover:bg-slate-50 border-b border-slate-400 border-print"><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-600">${globalIdx}</td><td class="p-2 border-r border-slate-400 border-print font-bold whitespace-nowrap">${escapeHtml(r.date)}</td><td class="p-2 border-r border-slate-400 border-print font-black text-indigo-700">SNA SPARSH</td><td class="p-2 border-r border-slate-400 border-print font-mono text-xs text-indigo-600 claim-text">${formatClaimDisplay(r.claimNo)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-rose-600">${formatINR(amt)}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-700">${vch}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-800 text-left">${escapeHtml(r.vendorName)}</td><td class="p-2 border-r border-slate-400 border-print text-slate-600 text-left text-xs font-bold leading-tight">${escapeHtml(getGujHeadName(r.componentName))}</td><td class="p-2 font-bold">${displayPfmsDate}</td></tr>`;
                    });
                    if(p === totalPages - 1) { html += `<tr class="bg-slate-100 print-no-bg border-t-2 border-slate-800 border-print"><td colspan="4" class="text-right font-black text-slate-800 border-r border-slate-400 border-print p-3">કુલ રકમ સરવાળો:</td><td class="text-right font-black text-rose-700 text-lg border-r border-slate-400 border-print p-3">${formatINR(grandPatrakTotal)}</td><td colspan="4" class="border-print"></td></tr>`; }
                    html += `</tbody></table></div>`;
                }
            }
            // 🚀 કેશબુક (ROWS_PER_PAGE = 12)
            else if (currentReportType === 'cashbook') {
                html += `<div class="folio-grid-container">`;
                let leftRowsHtml = [];
                let rightRowsHtml = [];
                let monthTotalInc = 0;
                let monthTotalExp = 0;

                let rStyle = 'style="height: auto; min-height: 28px; vertical-align: middle;"';
                let tStyle = 'style="height: auto; min-height: 24px; vertical-align: middle;"';

                leftRowsHtml.push(`<tr class="border-b border-slate-200 hover:bg-slate-50" ${rStyle}><td class="font-bold text-center text-xs">${openingBalDate}</td><td class="font-bold text-indigo-800 text-xs">-</td><td><div class="font-bold text-slate-900 text-xs">શ્રી ઉઘડતી સિલક</div></td><td class="text-center font-bold text-indigo-600 text-xs">-</td><td class="text-right font-black text-amber-800 text-xs">-</td><td class="text-right font-black text-indigo-800 text-xs">-</td><td class="text-right font-black text-emerald-800 text-xs">-</td></tr>`);
                rightRowsHtml.push(`<tr class="border-b border-slate-200" ${rStyle}><td colspan="9">&nbsp;</td></tr>`);

                uniqueDates.forEach((dateStr) => {
                    let dayTxns = displayData.filter(r => r.date === dateStr);
                    let dayTotalInc = 0, dayTotalExp = 0;
                    let dayHeads = {};

                    dayTxns.forEach(r => {
                        let h = r.componentName || "SNA Grant";
                        if (!dayHeads[h]) dayHeads[h] = 0;
                        let amt = parseFloat(r.amount) || 0;
                        dayHeads[h] += amt; dayTotalExp += amt; dayTotalInc += amt; monthTotalInc += amt; monthTotalExp += amt;
                    });

                    let tempLeft = []; let tempRight = [];

                    for (let h in dayHeads) {
                        let amt = dayHeads[h]; let displayHead = escapeHtml(getGujHeadName(h));
                        tempLeft.push(`<tr class="border-b border-slate-200 hover:bg-slate-50" ${rStyle}><td class="font-bold text-center text-xs">${escapeHtml(dateStr)}</td><td class="font-bold text-indigo-800 text-[13px] leading-tight">${displayHead}</td><td><div class="font-bold text-emerald-700 text-[10px]">ગ્રાન્ટ જમા (Virtual)</div></td><td class="text-center font-bold text-indigo-600 text-xs">${khatavahiPageMap[h] || "-"}</td><td class="text-right font-black text-amber-800 text-xs">-</td><td class="text-right font-black text-indigo-800 text-xs">${formatINR(amt)}</td><td class="text-right font-black text-emerald-800 text-xs">${formatINR(amt)}</td></tr>`);
                    }

                    dayTxns.forEach((exp, i) => {
                        let amt = parseFloat(exp.amount) || 0;
                        let vch = (exp.vchNo && exp.vchNo !== "N/A" && exp.vchNo !== "-") ? escapeHtml(exp.vchNo) : (i + 1);
                        let claimDisplay = formatClaimDisplay(exp.claimNo);
                        let displayHead = escapeHtml(getGujHeadName(exp.componentName));
                        let vNameDisplay = escapeHtml(exp.vendorName);
                        tempRight.push(`<tr class="border-b border-slate-200 hover:bg-slate-50" ${rStyle}><td class="font-bold text-center text-xs">${escapeHtml(exp.date)}</td><td class="font-bold text-slate-500 text-[10px] leading-tight">${displayHead}</td><td><div class="font-bold text-indigo-900 text-xs uppercase tracking-wide">${vNameDisplay} ખાતે ઉધાર</div></td><td class="text-center font-bold text-slate-700 text-xs">${vch}</td><td class="text-center font-mono text-[9px] text-indigo-600 claim-text leading-tight">${claimDisplay}</td><td class="text-center font-bold text-indigo-600 text-xs">${khatavahiPageMap[exp.componentName] || "-"}</td><td class="text-right font-black text-amber-800 text-xs">-</td><td class="text-right font-black text-indigo-800 text-xs">${formatINR(amt)}</td><td class="text-right font-black text-rose-800 text-xs">${formatINR(amt)}</td></tr>`);
                    });

                    let maxD = Math.max(tempLeft.length, tempRight.length);
                    for (let i = 0; i < maxD; i++) {
                        leftRowsHtml.push(tempLeft[i] || `<tr class="border-b border-slate-200" ${rStyle}><td colspan="7">&nbsp;</td></tr>`);
                        rightRowsHtml.push(tempRight[i] || `<tr class="border-b border-slate-200" ${rStyle}><td colspan="9">&nbsp;</td></tr>`);
                    }

                    leftRowsHtml.push(`<tr class="bg-emerald-50/50 font-bold border-b-2 border-slate-400" ${tStyle}><td colspan="5" class="text-right text-[11px] text-slate-700 py-1">તા. ${escapeHtml(dateStr)} કુલ જમા :</td><td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalInc)}</td><td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalInc)}</td></tr>`);
                    leftRowsHtml.push(`<tr class="border-b border-slate-200" ${tStyle}><td colspan="7">&nbsp;</td></tr>`);

                    rightRowsHtml.push(`<tr class="bg-rose-50/50 font-bold border-b border-slate-300" ${tStyle}><td colspan="6" class="text-right text-[11px] text-slate-700 py-1">તા. ${escapeHtml(dateStr)} કુલ ઉધાર :</td><td class="text-right font-black text-amber-900 text-xs">-</td><td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalExp)}</td><td class="text-right font-black text-rose-900 text-xs">${formatINR(dayTotalExp)}</td></tr>`);
                    rightRowsHtml.push(`<tr class="bg-emerald-50/70 font-bold border-b-2 border-slate-400" ${tStyle}><td colspan="6" class="text-right text-[11px] text-emerald-900 py-1">તા. ${escapeHtml(dateStr)} શ્રી બંધ સિલક :</td><td class="text-right font-black text-emerald-900 text-xs">-</td><td class="text-right font-black text-emerald-900 text-xs">0.00</td><td class="text-right font-black text-emerald-900 text-xs">0.00</td></tr>`);
                });

                leftRowsHtml.push(`<tr class="double-underline bg-slate-200" ${tStyle}><td colspan="5" class="text-right font-black text-slate-900 py-2.5 text-sm">કુલ જમા સરવાળો :</td><td class="text-right font-black text-indigo-900 text-sm">${formatINR(monthTotalInc)}</td><td class="text-right font-black text-emerald-900 text-sm">${formatINR(monthTotalInc)}</td></tr>`);
                rightRowsHtml.push(`<tr class="bg-slate-100 font-black border-t-2 border-slate-800" ${tStyle}><td colspan="6" class="text-right font-bold text-slate-700 py-1.5 text-xs">કુલ ઉધાર સરવાળો :</td><td class="text-right font-black text-amber-800 text-xs">-</td><td class="text-right font-black text-indigo-800 text-xs">${formatINR(monthTotalExp)}</td><td class="text-right font-black text-rose-800 text-xs">${formatINR(monthTotalExp)}</td></tr>`);

                const ROWS_PER_PAGE = 12; 
                const totalRows = Math.max(leftRowsHtml.length, rightRowsHtml.length);
                const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE) || 1;

                while (leftRowsHtml.length < totalPages * ROWS_PER_PAGE) leftRowsHtml.push(`<tr class="border-b border-slate-200" ${rStyle}><td colspan="7">&nbsp;</td></tr>`);
                while (rightRowsHtml.length < totalPages * ROWS_PER_PAGE) rightRowsHtml.push(`<tr class="border-b border-slate-200" ${rStyle}><td colspan="9">&nbsp;</td></tr>`);
                for (let p = 0; p < totalPages; p++) {
                    html += `<div class="folio-col page-chunk"><div class="cb-page-frame"><div class="bg-emerald-800 text-white p-2 text-center font-black text-sm">રોકડમેળ : જમા બાજુ (RECEIPT / CREDIT) - ડાબું પાનું (Page ${p + 1}/${totalPages})</div><div class="bg-slate-100 text-slate-800 p-1.5 text-center font-bold text-xs border-b border-slate-800 flex justify-between px-4"><span>${escapeHtml(currentSchool.name)} (SNA)</span><span>વર્ષ: ${fyYear}</span></div><table class="tally-table border-t-2 border-slate-800 border-print w-full"><thead><tr class="bg-emerald-50 text-emerald-900 border-b-2 border-slate-800 border-print"><th class="w-16 border-r border-slate-800 border-print">તારીખ</th><th class="w-24 border-r border-slate-800 border-print">હેડ (સદર)</th><th class="border-r border-slate-800 border-print">આવક / જમા વિગત</th><th class="w-12 border-r border-slate-800 border-print">ખા.પેજ</th><th class="w-16 text-right border-r border-slate-800 border-print">રોકડ (₹)</th><th class="w-20 text-right border-r border-slate-800 border-print">બેંક (₹)</th><th class="w-24 text-right border-print">કુલ (₹)</th></tr></thead><tbody>`;
                    for (let r = p * ROWS_PER_PAGE; r < (p + 1) * ROWS_PER_PAGE; r++) if (leftRowsHtml[r]) html += leftRowsHtml[r];
                    html += `</tbody></table></div></div>`;
                    html += `<div class="folio-col page-chunk"><div class="cb-page-frame"><div class="bg-rose-800 text-white p-2 text-center font-black text-sm">રોકડમેળ : ઉધાર બાજુ (PAYMENT / DEBIT) - જમણું પાનું (Page ${p + 1}/${totalPages})</div><div class="bg-slate-100 text-slate-800 p-1.5 text-center font-bold text-xs border-b border-slate-800 flex justify-between px-4"><span>${escapeHtml(currentSchool.name)} (SNA)</span><span>વર્ષ: ${fyYear}</span></div><table class="tally-table border-t-2 border-slate-800 border-print w-full"><thead><tr class="bg-rose-50 text-rose-900 border-b-2 border-slate-800 border-print"><th class="w-16 border-r border-slate-800 border-print">તારીખ</th><th class="w-20 border-r border-slate-800 border-print">હેડ (સદર)</th><th class="border-r border-slate-800 border-print">ખર્ચ / ઉધાર વિગત</th><th class="w-10 border-r border-slate-800 border-print">વા.નં.</th><th class="w-36 border-r border-slate-800 border-print">SNA Claim</th><th class="w-10 border-r border-slate-800 border-print">ખા.પેજ</th><th class="w-14 text-right border-r border-slate-800 border-print">રોકડ (₹)</th><th class="w-16 text-right border-r border-slate-800 border-print">બેંક (₹)</th><th class="w-20 text-right border-print">કુલ (₹)</th></tr></thead><tbody>`;
                    for (let r = p * ROWS_PER_PAGE; r < (p + 1) * ROWS_PER_PAGE; r++) if (rightRowsHtml[r]) html += rightRowsHtml[r];
                    html += `</tbody></table></div></div>`;
                }
            }
            // 🚀 ખાતાવહી (ROWS_PER_PAGE = 13)
            else if (currentReportType === 'ledger') {
                let dailyHeadTotals = {}; displayData.forEach(r => { let key = r.date + "||" + (r.componentName || "-"); if(!dailyHeadTotals[key]) dailyHeadTotals[key] = 0; dailyHeadTotals[key] += (parseFloat(r.amount) || 0); });
                let headGroups = {}; for(let key in dailyHeadTotals) { let [d, h] = key.split("||"); let dayGrant = dailyHeadTotals[key]; if(selectedHead !== 'ALL' && h !== selectedHead) continue; if(!headGroups[h]) headGroups[h] = []; headGroups[h].push({d: d, grant: dayGrant}); }

                if (Object.keys(headGroups).length === 0) { html += `<div class="text-center py-10 font-bold text-slate-400">કોઈ ડેટા ઉપલબ્ધ નથી.</div>`; } else {
                    let sortedHeads = Object.keys(headGroups).sort((a, b) => { let pA = parseInt(khatavahiPageMap[a]) || 999; let pB = parseInt(khatavahiPageMap[b]) || 999; return pA - pB; });
                    for(let h of sortedHeads) {
                        let displayHead = escapeHtml(getGujHeadName(h));
                        let headEntries = []; let headTotalInc = 0; let headTotalExp = 0;
                        headEntries.push({type: 'opening', date: openingBalDate});
                        headGroups[h].forEach(hg => {
                            let d = hg.d; let dayGrant = hg.grant; let cbPageNo = cashbookPageMap[d] || "-";
                            if(dayGrant > 0) { headEntries.push({type: 'inc', date: d, amount: dayGrant, cb: cbPageNo}); headTotalInc += dayGrant; }
                            let dayExpenses = displayData.filter(r => r.date === d && (r.componentName||"-") === h);
                            dayExpenses.forEach((r, i) => { 
                                headEntries.push({type: 'exp', data: r, index: i, cb: cbPageNo});
                                headTotalExp += (parseFloat(r.amount) || 0);
                            });
                        });

                        const ROWS_PER_PAGE = 13; 
                        let totalPages = Math.ceil(headEntries.length / ROWS_PER_PAGE) || 1;
                        for(let p=0; p<totalPages; p++) {
                            let villageText = (currentSchool.taluka && currentSchool.taluka !== "-" && currentSchool.taluka !== "..........") ? `ગામ : ${escapeHtml(currentSchool.taluka)}<br>` : "";
                            html += `<div class="ledger-page page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-lg mb-2 text-slate-800">(પરિશિષ્ટ નંબર-૨) આવક/ખર્ચનું વર્ગીકરણ (ક્લાસીફાઈડ રજીસ્ટર) (ખાતાવહી) ${totalPages > 1 ? `(Page ${p+1}/${totalPages})` : ''}</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">S.M.C./B.R.C./C.R.C.<br>શાળાનું નામ : ${escapeHtml(currentSchool.name)}<br>સદર (હેડનું નામ) : <span class="text-indigo-700 text-lg uppercase">${displayHead}</span></div><div class="text-right">વર્ષ : ${fyYear}<br>${villageText}<span class="bg-indigo-100 px-2 py-1 rounded border border-indigo-200">ખાતાવહી પાના નં: ${khatavahiPageMap[h] || "-"}</span></div></div></div><table class="tally-table border-2 border-slate-800 border-print w-full text-center mb-8"><thead class="bg-slate-100 print-no-bg border-b-2 border-slate-800 border-print"><tr><th class="border-r border-slate-800 border-print p-2">તારીખ</th><th class="border-r border-slate-800 border-print p-2">પહોંચ નંબર<br>અને તારીખ</th><th class="border-r border-slate-800 border-print text-emerald-700">આવક<br>રકમ રૂ.</th><th class="border-r border-slate-800 border-print p-2">વાઉચર નંબર<br>અને તારીખ</th><th class="border-r border-slate-800 border-print text-rose-700">ખર્ચની<br>રકમ રૂ.</th><th class="border-r border-slate-800 border-print p-2">કેશબુક<br>પાના નંબર</th><th class="border-print p-2 w-1/4">રિમાર્ક્સ</th></tr><tr class="text-sm text-slate-600"><th class="border-r border-slate-800 border-print py-0.5">૧</th><th class="border-r border-slate-800 border-print py-0.5">૨</th><th class="border-r border-slate-800 border-print py-0.5">૩</th><th class="border-r border-slate-800 border-print py-0.5">૪</th><th class="border-r border-slate-800 border-print py-0.5">૫</th><th class="border-r border-slate-800 border-print py-0.5">૬</th><th class="border-print py-0.5">૭</th></tr></thead><tbody>`;
                            let chunk = headEntries.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                            chunk.forEach(ent => {
                                if(ent.type === 'opening') {
                                    html += `<tr class="border-b border-slate-400 hover:bg-slate-50 border-print"><td class="border-r border-slate-400 border-print font-bold">${ent.date}</td><td class="border-r border-slate-400 border-print font-bold">-</td><td class="border-r border-slate-400 border-print text-right font-black text-emerald-600">-</td><td class="border-r border-slate-400 border-print font-bold">-</td><td class="border-r border-slate-400 border-print text-right font-black">-</td><td class="border-r border-slate-400 border-print font-bold text-slate-400">-</td><td class="font-bold text-slate-600 border-print text-left">ગત વર્ષની બચત (ઉઘડતી સિલક)</td></tr>`;
                                } else if(ent.type === 'inc') {
                                    html += `<tr class="bg-emerald-50/30 print-no-bg border-b border-slate-300 border-print"><td class="border-r border-slate-400 border-print font-bold text-emerald-800">${escapeHtml(ent.date)}</td><td class="border-r border-slate-400 border-print font-bold">-</td><td class="border-r border-slate-400 border-print text-right font-black text-emerald-700">${formatINR(ent.amount)}</td><td class="border-r border-slate-400 border-print font-bold">-</td><td class="border-r border-slate-400 border-print text-right font-black text-slate-400">-</td><td class="border-r border-slate-400 border-print font-bold text-indigo-600">${ent.cb}</td><td class="font-bold text-emerald-700 border-print text-left">ગ્રાન્ટ જમા</td></tr>`;
                                } else if(ent.type === 'exp') {
                                    let r = ent.data; let i = ent.index;
                                    let vch = (r.vchNo && r.vchNo !== "N/A" && r.vchNo !== "-") ? escapeHtml(r.vchNo) : (i + 1); let claimDisplay = formatClaimDisplay(r.claimNo); 
                                    html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="border-r border-slate-400 border-print font-bold">${escapeHtml(r.date)}</td><td class="border-r border-slate-400 border-print font-bold text-slate-400">-</td><td class="border-r border-slate-400 border-print text-right font-black text-slate-400">-</td><td class="border-r border-slate-400 border-print font-bold">${vch}<br><span class="text-[9px] text-slate-500">${escapeHtml(r.date)}</span></td><td class="border-r border-slate-400 border-print text-right font-black text-rose-600">${formatINR(r.amount)}</td><td class="border-r border-slate-400 border-print font-bold text-indigo-600">${ent.cb}</td><td class="font-bold text-slate-700 border-print text-xs text-left"><div class="text-indigo-900">${escapeHtml(r.vendorName)}</div><div class="text-[9px] text-indigo-600 font-mono mt-0.5 claim-text">SNA Claim: ${claimDisplay}</div></td></tr>`;
                                }
                            });
                            if(p === totalPages - 1) {
                                html += `<tr class="bg-slate-100 print-no-bg border-t-2 border-slate-800 border-print"><td colspan="2" class="text-right font-bold text-slate-800 border-r border-slate-400 border-print p-2">કુલ:</td><td class="text-right font-black text-emerald-700 border-r border-slate-400 border-print p-2">${formatINR(headTotalInc)}</td><td class="border-r border-slate-400 border-print p-2"></td><td class="text-right font-black text-rose-700 border-r border-slate-400 border-print p-2">${formatINR(headTotalExp)}</td><td colspan="2" class="border-print"></td></tr>`; 
                            }
                            html += `</tbody></table></div>`;
                        }
                    }
                }
            }
            // 🚀 SNA Passbook (ROWS_PER_PAGE = 12)
            else if (currentReportType === 'epayment') {
                const ROWS_PER_PAGE = 12; let totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE) || 1;
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-lg mb-2 text-slate-800">SNA Passbook (E-Payment Ledger) (Page ${p+1}/${totalPages})</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">સંસ્થાનું નામ : ${escapeHtml(currentSchool.name)}<br>ફંડનો પ્રકાર : SNA SPARSH</div><div class="text-right">વર્ષ : ${fyYear}</div></div></div><table class="tally-table w-full text-center border-2 border-slate-800 border-print"><thead class="print-no-bg bg-slate-100 border-b-2 border-slate-800 border-print"><tr><th class="p-2 border-r border-slate-800 border-print">Order Date<br>(આદેશ તારીખ)</th><th class="p-2 border-r border-slate-800 border-print">SNA SPARSH વિગત (પાર્ટીનું નામ)</th><th class="p-2 border-r border-slate-800 border-print">SNA SPARSH Claim Number</th><th class="text-right p-2 border-r border-slate-800 border-print">SNA SPARSH રકમ</th><th class="p-2 border-r border-slate-800 border-print">વા. નં.</th><th class="p-2 border-r border-slate-800 border-print">હેડ</th><th class="p-2 border-r border-slate-800 border-print">PFMS Settlement<br>(પાસ તારીખ)</th><th class="p-2 border-print">સ્ટેટસ</th></tr></thead><tbody>`;
                    let chunk = displayData.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((r, i) => { 
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let vch = (r.vchNo && r.vchNo !== "N/A" && r.vchNo !== "-") ? escapeHtml(r.vchNo) : globalIdx;
                        
                        let sUpper = String(r.status || "").toUpperCase();
                        let statusColor = 'text-amber-600';
                        let amountStyle = 'text-emerald-600';
                        let displayPfmsDate = (!r.pfmsDate || r.pfmsDate === "-") ? `<span class="text-[10px] text-amber-600 font-bold border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>` : `<span class="text-emerald-700 font-bold">${escapeHtml(r.pfmsDate)}</span>`;
                        
                        if(sUpper.includes('SUCCESS') || sUpper.includes('COMPLETED')) {
                            statusColor = 'text-emerald-600';
                        }
                        else if(sUpper.includes('REJECT') || sUpper.includes('FAIL') || sUpper.includes('CANCEL') || sUpper.includes('RETURN')) { 
                            statusColor = 'text-rose-600 font-black'; 
                            amountStyle = 'text-rose-400 line-through';
                        } 
                        else if(sUpper.includes('PENDING')) {
                            statusColor = 'text-blue-600';
                        }

                        html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="p-2 border-r border-slate-400 border-print">${escapeHtml(r.date)}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-800 text-left">${escapeHtml(r.vendorName)}</td><td class="p-2 border-r border-slate-400 border-print font-mono text-indigo-600 font-bold claim-text">${formatClaimDisplay(r.claimNo)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black ${amountStyle}">${formatINR(r.amount)}</td><td class="p-2 border-r border-slate-400 border-print text-center">${vch}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-600 text-xs">${escapeHtml(getGujHeadName(r.componentName||"-"))}</td><td class="p-2 border-r border-slate-400 border-print text-center">${displayPfmsDate}</td><td class="p-2 border-print text-center text-xs font-bold ${statusColor}">${escapeHtml(r.status)}</td></tr>`; 
                    });
                    html += `</tbody></table></div>`; 
                }
            }
            // 🚀 Bill Register (ROWS_PER_PAGE = 15)
            else if (currentReportType === 'bill') {
                const ROWS_PER_PAGE = 15; let totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE) || 1;
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-lg mb-2 text-slate-800">વર્ષ દરમિયાનનું બિલોનું નોંધપત્રક (બિલ રજીસ્ટર) (Page ${p+1}/${totalPages})</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">સંસ્થાનું નામ : ${escapeHtml(currentSchool.name)}<br>ફંડનો પ્રકાર : SNA SPARSH (Virtual Limit)</div><div class="text-right">વર્ષ : ${fyYear}<br>ચુકવણી રૂટ : IFMS / PFMS</div></div></div><table class="tally-table w-full text-center border-2 border-slate-800 border-print"><thead class="print-no-bg bg-slate-100 border-b-2 border-slate-800 border-print"><tr><th class="p-2 border-r border-slate-800 border-print">વાઉચર<br>નંબર</th><th class="p-2 border-r border-slate-800 border-print w-20">તારીખ</th><th class="p-2 border-r border-slate-800 border-print">બિલની વિગત<br>(હેડ)</th><th class="p-2 border-r border-slate-800 border-print">બિલ કોના તરફથી<br>મળેલ છે?</th><th class="p-2 border-r border-slate-800 border-print text-right">બિલની રકમ</th><th class="p-2 border-r border-slate-800 border-print text-right">કપાત</th><th class="p-2 border-r border-slate-800 border-print text-right">ચુકવવાની થતી<br>ચોખ્ખી રકમ</th><th class="p-2 border-r border-slate-800 border-print">મંજુર કરનાર<br>અધિકારીની સહી</th><th class="p-2 border-r border-slate-800 border-print">કેશબુક<br>પા.નં.</th><th class="p-2 border-print">શેરો</th></tr></thead><tbody>`;
                    let chunk = displayData.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((r, i) => { 
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let vch = (r.vchNo && r.vchNo !== "N/A" && r.vchNo !== "-") ? escapeHtml(r.vchNo) : globalIdx; let cbPageNo = cashbookPageMap[r.date] || "-";
                        html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="p-2 border-r border-slate-400 border-print text-center font-bold text-slate-600">${vch}</td><td class="p-2 border-r border-slate-400 border-print text-center whitespace-nowrap">${escapeHtml(r.date)}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-700 text-left text-xs">${escapeHtml(getGujHeadName(r.componentName||"-"))}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-indigo-700 text-left">${escapeHtml(r.vendorName)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black">${formatINR(r.amount)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-bold text-slate-400">0.00</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-rose-600">${formatINR(r.amount)}</td><td class="p-2 border-r border-slate-400 border-print"></td><td class="p-2 border-r border-slate-400 border-print text-center font-bold text-emerald-600">${cbPageNo}</td><td class="p-2 border-print"></td></tr>`; 
                    });
                    html += `</tbody></table></div>`; 
                }
            }
            // 🚀 FTO Register (ROWS_PER_PAGE = 9)
            else if (currentReportType === 'cheque') {
                const ROWS_PER_PAGE = 9; let totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE) || 1;
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-lg mb-2 text-slate-800">SNA E-Payment / FTO નોંધપત્રક (Page ${p+1}/${totalPages})</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">સંસ્થાનું નામ : ${escapeHtml(currentSchool.name)}<br>ફંડનો પ્રકાર : SNA SPARSH</div><div class="text-right">વર્ષ : ${fyYear}<br>ચુકવણી રૂટ : IFMS / PFMS</div></div></div><table class="tally-table w-full text-center border-2 border-slate-800 border-print"><thead class="print-no-bg bg-slate-100 border-b-2 border-slate-800 border-print"><tr><th class="p-2 border-r border-slate-800 border-print">ક્રમ</th><th class="p-2 border-r border-slate-800 border-print">આદેશ તારીખ</th><th class="p-2 border-r border-slate-800 border-print">SNA Claim / FTO નંબર</th><th class="p-2 border-r border-slate-800 border-print">વા. નં</th><th class="p-2 border-r border-slate-800 border-print">કઈ બાબતે કોને પેમેન્ટ કર્યું તેની વિગતો</th><th class="p-2 border-r border-slate-800 border-print text-right">ચુકવેલ રકમ</th><th class="p-2 border-r border-slate-800 border-print text-right">બિલની રકમ</th><th class="p-2 border-r border-slate-800 border-print">બિલ હેડ વિગતો</th><th class="p-2 border-r border-slate-800 border-print">PFMS Settlement તારીખ</th><th class="p-2 border-print">કેશબુક પા.નં.</th></tr></thead><tbody>`;
                    let chunk = displayData.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((r, i) => { 
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let vch = (r.vchNo && r.vchNo !== "N/A" && r.vchNo !== "-") ? escapeHtml(r.vchNo) : globalIdx; let cbPageNo = cashbookPageMap[r.date] || "-";
                        let displayPfmsDate = (!r.pfmsDate || r.pfmsDate === "-") ? `<span class="text-[10px] text-amber-600 font-bold border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>` : `<span class="text-emerald-700 font-bold">${escapeHtml(r.pfmsDate)}</span>`;
                        html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="p-2 border-r border-slate-400 border-print text-center">${globalIdx}</td><td class="p-2 border-r border-slate-400 border-print">${escapeHtml(r.date)}</td><td class="p-2 border-r border-slate-400 border-print font-mono text-indigo-600 font-bold claim-text">${formatClaimDisplay(r.claimNo)}</td><td class="p-2 border-r border-slate-400 border-print text-center">${vch}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-left">${escapeHtml(r.vendorName)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-emerald-700">${formatINR(r.amount)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-bold text-slate-700">${formatINR(r.amount)}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-600 text-xs">${escapeHtml(getGujHeadName(r.componentName||"-"))}</td><td class="p-2 border-r border-slate-400 border-print text-center">${displayPfmsDate}</td><td class="p-2 border-print text-center font-bold text-indigo-600">${cbPageNo}</td></tr>`; 
                    });
                    html += `</tbody></table></div>`; 
                }
            }
            // 🚀 Grant Register (ROWS_PER_PAGE = 13)
            else if (currentReportType === 'grant') {
                let grouped = {}; displayData.forEach(r => { let h = r.componentName||"Unknown"; if(!grouped[h]) grouped[h]=0; grouped[h]+=(parseFloat(r.amount)||0); });
                let headsArray = Object.keys(grouped); let grandTotal = 0; headsArray.forEach(h => grandTotal += grouped[h]);
                const ROWS_PER_PAGE = 13; let totalPages = Math.ceil(headsArray.length / ROWS_PER_PAGE) || 1;
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="font-bold text-lg mb-2 text-slate-800">ગ્રાન્ટ રજીસ્ટર : પરિશિષ્ટ ૧૧ (Page ${p+1}/${totalPages})</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left">INSTITUTE: ${escapeHtml(currentSchool.name)}<br>Type: SNA SPARSH (Virtual Limit)</div><div class="text-right">વર્ષ : ${fyYear}</div></div></div><table class="tally-table w-full text-center border-2 border-slate-800 border-print"><thead class="print-no-bg bg-slate-100"><tr class="border-b-2 border-slate-800 border-print"><th rowspan="2" class="p-2 border-r border-slate-800 border-print">ક્રમ</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">કોના તરફથી મળી</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">ગ્રાન્ટ જમા રકમ</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">ક્યાં કામે મળ્યા ? (Head)</th><th colspan="2" class="p-2 border-r border-slate-800 border-print bg-indigo-50 border-b print-no-bg">બેંક/ટ્રેઝરીમાં જમા કર્યાની વિગત</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">કોને ફાળવેલ</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">ખર્ચેલ રકમ</th><th rowspan="2" class="p-2 border-r border-slate-800 border-print">બચત ગ્રાન્ટ</th><th rowspan="2" class="p-2 border-print">રીમાર્કસ</th></tr><tr class="border-b-2 border-slate-800 border-print"><th class="p-2 border-r border-slate-800 border-print bg-indigo-50 print-no-bg">A/c No (Virtual)</th><th class="p-2 border-r border-slate-800 border-print bg-indigo-50 print-no-bg">Route / Bank</th></tr></thead><tbody>`;
                    let chunk = headsArray.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((h, i) => { 
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let exp = grouped[h]; 
                        html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="p-2 border-r border-slate-400 border-print text-center">${globalIdx}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-600 text-center">SSA / GOG</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-indigo-700">${formatINR(exp)}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-slate-800 text-xs">${escapeHtml(getGujHeadName(h))}</td><td class="p-2 border-r border-slate-400 border-print text-center font-mono text-[10px]">Virtual Limit</td><td class="p-2 border-r border-slate-400 border-print text-center font-bold text-[10px]">PFMS / IFMS</td><td class="p-2 border-r border-slate-400 border-print text-center font-bold text-slate-600">SMC (SNA)</td><td class="p-2 border-r border-slate-400 border-print text-right font-bold text-rose-600">${formatINR(exp)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-slate-400">0.00</td><td class="p-2 border-print"></td></tr>`; 
                    });
                    if(p === totalPages - 1) { html += `<tr class="bg-slate-100 print-no-bg border-t-2 border-slate-800 border-print"><td colspan="2" class="p-2 border-r border-slate-400 border-print text-right text-sm font-bold">કુલ રકમ :</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-indigo-700 text-lg">${formatINR(grandTotal)}</td><td colspan="4" class="p-2 border-r border-slate-400 border-print"></td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-rose-600 text-lg">${formatINR(grandTotal)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-slate-500 text-lg">0.00</td><td class="p-2 border-print"></td></tr>`; }
                    html += `</tbody></table></div>`;
                }
            }
            // 🚀 P10 (ROWS_PER_PAGE = 14 + SMART AUTO CAPTURE)
            else if (currentReportType === 'p10') {
                let grouped = {}; displayData.forEach(r => { let h = r.componentName||"Unknown"; if(!grouped[h]) grouped[h]=0; grouped[h]+=(parseFloat(r.amount)||0); });
                let headsArray = Object.keys(grouped); let expTotal = 0; headsArray.forEach(h => expTotal += grouped[h]);
                
                let dashGrantEl = document.getElementById('dashGrant');
                let realDashboardGrant = dashGrantEl ? parseFloat(dashGrantEl.innerText.replace(/[^0-9.-]/g, '')) : 0;
                
                let autoMotherSanction = window.totalVirtualLimit || window.motherSanctionAmount || realDashboardGrant;
                if(autoMotherSanction < expTotal) autoMotherSanction = expTotal;
                
                let headOptions = headsArray.map(h => `<option value="${escapeHtml(getGujHeadName(h))}"></option>`).join('');
                headOptions += `<option value="રોકડ ખાતું/અનામત ખાતે"></option>`;

                let remTotal = autoMotherSanction - expTotal;
                if (remTotal < 0) remTotal = 0;

                let smartPanel = `
                <div class="no-print bg-amber-50 border border-amber-300 p-4 mb-6 rounded-lg shadow-md w-full lg:w-[90%] mx-auto">
                    <div class="font-black text-amber-800 text-base mb-3">⚡ SMART SETUP (P10) :</div>
                    
                    <div class="flex flex-wrap gap-4 items-center mb-4">
                        <div>
                            <label class="text-sm font-bold text-slate-700">Mother Sanction (કુલ ગ્રાન્ટ): </label>
                            <input type="number" id="inpTotalGrant" class="ml-1 p-2 border-2 border-indigo-400 rounded w-40 font-black text-indigo-700 text-lg" 
                                value="${autoMotherSanction}" 
                                onkeyup="updateSmartP10(${expTotal}, '${reportEndDate}', '${fyYear}')" 
                                onchange="updateSmartP10(${expTotal}, '${reportEndDate}', '${fyYear}')">
                        </div>
                        <div class="text-xs text-slate-500 font-bold bg-white p-2 rounded border border-amber-200">
                            * Auto: ₹ ${formatINR(autoMotherSanction)} | Spent: ₹ ${formatINR(expTotal)} | Remaining: ₹ <span id="lblRemTotal">${formatINR(remTotal)}</span>
                        </div>
                    </div>

                    <div class="font-bold text-slate-700 text-sm mb-2">બચતનું વિભાજન (Remaining Split) — Dynamic:</div>
                    
                    <div class="space-y-2" id="remSplitBox">
                        <!-- Dynamic rows will be added here -->
                    </div>

                    <div class="mt-3 flex gap-2">
                        <button type="button" onclick="addRemHeadRow(${expTotal}, '${reportEndDate}', '${fyYear}')" 
                            class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700">
                            + Add Head
                        </button>
                        <div class="text-xs text-slate-500 font-bold self-center">
                            કુલ Remaining Amount = Mother Sanction − Spent હોવું જોઈએ
                        </div>
                    </div>
                    
                    <datalist id="remHeadList">${headOptions}</datalist>
                    
                    <div id="p10YearEndWarning" class="mt-3 p-3 rounded-lg border-2 border-rose-400 bg-rose-50 text-rose-800 text-sm font-bold hidden">
                        ⚠️ 31 March ના રોજ આ બચત આપોઆપ શૂન્ય થઈ જશે (Grant Lapse). આ મેસેજ ફક્ત સૂચના છે – સર્ટિફિકેટમાં છપાશે નહીં.
                    </div>
                </div>`;
                
                let certHtml = `આથી પ્રમાણપત્ર આપવામાં આવે છે કે સને ${fyYear} નાણાકીય વર્ષમાં કુલ રૂ. <span class="font-black text-indigo-700 dyn-total-grant">${formatINR(autoMotherSanction)}</span> (અંકે <span class="dyn-words">${(typeof getGujaratiWords === 'function' ? getGujaratiWords(autoMotherSanction) : formatINR(autoMotherSanction))}</span>) મળેલ છે. જે પૈકી રૂપિયા <span class="font-black">${formatINR(expTotal)}</span> (અંકે ${(typeof getGujaratiWords === 'function' ? getGujaratiWords(expTotal) : formatINR(expTotal))}) પુરા ખર્ચ થયેલ છે. અગાઉના વર્ષની બચત સહિત ${reportEndDate} ના રોજ રૂપિયા <span class="font-black text-rose-600 dyn-rem-amt">0.00</span> બચત રહેલ છે. આ ઉપરાંત આવક અને ખર્ચના આંકડા સંબંધિત હિસાબી રેકર્ડ સાથે ચકાસણી કરીને દર્શાવેલા છે.`;

                const ROWS_PER_PAGE = 14; let totalPages = Math.ceil((headsArray.length+1) / ROWS_PER_PAGE) || 1;
                html += smartPanel;
                
                for(let p=0; p<totalPages; p++) {
                    html += `<div class="page-chunk"><div class="mb-6 text-center print-no-bg w-full lg:w-[90%] mx-auto"><h2 class="font-bold text-2xl mb-1 text-slate-800">પરિશિષ્ટ -૧૦ (Page ${p+1}/${totalPages})</h2><h3 class="font-bold text-lg mb-4 text-slate-600">ગ્રાન્ટ વપરાશ પ્રમાણપત્ર (વર્ષ : ${fyYear})</h3>`;
                    if(p===0) html += `<p class="text-base font-bold text-slate-700 leading-relaxed text-justify indent-8 mb-6 font-normal whitespace-normal dyn-cert-text">${certHtml}</p>`;
                    html += `<div class="flex justify-between text-base font-bold text-slate-700 border-b-2 border-slate-800 pb-2 mb-4"><div class="text-left">${escapeHtml(currentSchool.name)}<br>A/C: SNA Virtual Limit</div><div class="text-right">Route: IFMS / PFMS</div></div></div><table class="tally-table border-2 border-slate-800 border-print w-full lg:w-[90%] mx-auto"><thead class="bg-slate-100 print-no-bg border-b-2 border-slate-800 border-print"><tr class="text-center"><th class="p-2 border-r border-slate-800 border-print">ક્રમ</th><th class="p-2 border-r border-slate-800 border-print">ગ્રાન્ટ / હેડની વિગત</th><th class="p-2 border-r border-slate-800 border-print">શરૂઆતની સિલક (Limit)</th><th class="p-2 border-r border-slate-800 border-print">આ વર્ષ દરમ્યાન<br>મળેલ ગ્રાન્ટ (Limit)</th><th class="p-2 border-r border-slate-800 border-print">કુલ ગ્રાન્ટ<br>(4+5)</th><th class="p-2 border-r border-slate-800 border-print">SNA SPARSH દ્વારા<br>ખર્ચ / પરત કરેલ ગ્રાન્ટ</th><th class="p-2 border-r border-slate-800 border-print">રોકડ<br>(3+8-9)</th><th class="p-2 border-r border-slate-800 border-print">કુલ બંધ સિલક (લિમિટ)<br>(6-7)</th><th class="p-2 border-print">કુલ<br>(10+11)</th></tr><tr class="text-[10px] text-slate-500 bg-slate-200 border-b-2 border-slate-800 border-print print-no-bg"><th class="p-1 border-r border-slate-800 border-print">1</th><th class="p-1 border-r border-slate-800 border-print">2</th><th class="p-1 border-r border-slate-800 border-print">4</th><th class="p-1 border-r border-slate-800 border-print">5</th><th class="p-1 border-r border-slate-800 border-print">6</th><th class="p-1 border-r border-slate-800 border-print">7</th><th class="p-1 border-r border-slate-800 border-print">10</th><th class="p-1 border-r border-slate-800 border-print">11</th><th class="p-1 border-print">12</th></tr></thead><tbody>`;
                    
                    let chunk = headsArray.slice(p*ROWS_PER_PAGE, (p+1)*ROWS_PER_PAGE);
                    chunk.forEach((h, i) => { 
                        let globalIdx = p*ROWS_PER_PAGE + i + 1; let exp = grouped[h]; 
                        html += `<tr class="border-b border-slate-400 border-print hover:bg-slate-50"><td class="p-2 border-r border-slate-400 border-print text-center">${globalIdx}</td><td class="p-2 border-r border-slate-400 border-print font-bold text-indigo-700 text-sm p-2 text-left">${escapeHtml(getGujHeadName(h))}</td><td class="p-2 border-r border-slate-400 border-print text-right p-2">0.00</td><td class="p-2 border-r border-slate-400 border-print text-right p-2">${formatINR(exp)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-black p-2">${formatINR(exp)}</td><td class="p-2 border-r border-slate-400 border-print text-right font-bold text-rose-600 p-2">${formatINR(exp)}</td><td class="p-2 border-r border-slate-400 border-print text-right p-2">0.00</td><td class="p-2 border-r border-slate-400 border-print text-right font-black text-slate-400 p-2">0.00</td><td class="p-2 border-print text-right font-black text-slate-400 p-2">0.00</td></tr>`; 
                    });
                    
                    if(p === totalPages - 1) {
                        let remSplits = window._p10RemSplits || [];
                        if (remSplits.length === 0 && (window._p10TotalRem || 0) > 0 && !window._p10IsYearEnd) {
                            remSplits = [{ head: 'રોકડ ખાતું/અનામત ખાતે', amount: window._p10TotalRem }];
                        }

                        let existingMap = {};
                        headsArray.forEach((h, i) => {
                            existingMap[String(getGujHeadName(h)).trim()] = i; 
                        });

                        let newHeads = [];
                        remSplits.forEach(s => {
                            let clean = String(s.head).trim();
                            if (!existingMap.hasOwnProperty(clean)) {
                                newHeads.push(s);
                            }
                        });

                        newHeads.forEach((s, idx) => {
                            let srNo = headsArray.length + idx + 1;
                            html += `<tr class="border-b border-slate-400 border-print p10-rem-row">
                                <td class="p-2 border-r border-slate-400 border-print text-center font-bold text-emerald-700">${srNo}</td>
                                <td class="p-2 border-r border-slate-400 border-print font-bold text-emerald-700 text-sm text-left">${escapeHtml(s.head)}</td>
                                <td class="p-2 border-r border-slate-400 border-print text-right">0.00</td>
                                <td class="p-2 border-r border-slate-400 border-print text-right font-bold text-emerald-700">${formatINR(s.amount)}</td>
                                <td class="p-2 border-r border-slate-400 border-print text-right font-black text-emerald-700">${formatINR(s.amount)}</td>
                                <td class="p-2 border-r border-slate-400 border-print text-right">0.00</td>
                                <td class="p-2 border-r border-slate-400 border-print"></td>
                                <td class="p-2 border-r border-slate-400 border-print text-right font-black text-emerald-700">${formatINR(s.amount)}</td>
                                <td class="p-2 border-print text-right font-black text-emerald-700">${formatINR(s.amount)}</td>
                            </tr>`;
                        });

                        html += `<tr class="bg-slate-100 print-no-bg border-t-2 border-slate-800 border-print">
                            <th colspan="2" class="p-2 border-r border-slate-400 border-print text-right text-base">કુલ :</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right">0.00</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right text-xl text-indigo-700 dyn-total-grant">${formatINR(autoMotherSanction)}</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right text-xl text-indigo-700 dyn-total-grant">${formatINR(autoMotherSanction)}</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right text-xl text-rose-600">${formatINR(expTotal)}</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right">0.00</th>
                            <th class="p-2 border-r border-slate-400 border-print text-right text-xl text-emerald-600 dyn-rem-amt">${formatINR(window._p10TotalRem || 0)}</th>
                            <th class="p-2 border-print text-right text-xl text-emerald-600 dyn-rem-amt">${formatINR(window._p10TotalRem || 0)}</th>
                        </tr>`;
                    }
                    html += `</tbody></table></div>`;
                }
                setTimeout(() => { 
                    initRemSplitBox(expTotal, reportEndDate, fyYear, (autoMotherSanction - expTotal) > 0 ? (autoMotherSanction - expTotal) : 0);
                    updateSmartP10(expTotal, reportEndDate, fyYear); 
                }, 50);
            }
            // 🚀 P9 (SMART LIMIT LINK)
            else if (currentReportType === 'p9') {
                let expTotal = 0; displayData.forEach(r => expTotal += (parseFloat(r.amount)||0));
                
                let dashGrantEl = document.getElementById('dashGrant');
                let realDashboardGrant = dashGrantEl ? parseFloat(dashGrantEl.innerText.replace(/[^0-9.-]/g, '')) : 0;
                
                let autoMotherSanction = window.totalVirtualLimit || window.motherSanctionAmount || realDashboardGrant;
                if(autoMotherSanction < expTotal) autoMotherSanction = expTotal;
                
                let smartPanel = `
                <div class="no-print bg-amber-50 border border-amber-300 p-4 mb-6 rounded-lg flex flex-wrap gap-4 items-center shadow-md w-full lg:w-[80%] mx-auto">
                    <div class="font-black text-amber-800 text-base">⚡ SMART SETUP (P9) :</div>
                    <div><label class="text-sm font-bold text-slate-700">Mother Sanction (કુલ ગ્રાન્ટ): </label>
                        <input type="number" id="inpTotalGrant" class="ml-1 p-1.5 border-2 border-indigo-400 rounded w-40 font-black text-indigo-700" value="${autoMotherSanction}" onkeyup="document.querySelector('.dyn-rem-amt').innerText = parseFloat((parseFloat(this.value)||0) - ${expTotal}).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})" onchange="document.querySelector('.dyn-rem-amt').innerText = parseFloat((parseFloat(this.value)||0) - ${expTotal}).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})">
                    </div>
                </div>`;

                html += `<div class="page-chunk">
                ${smartPanel}
                <div class="mb-8 text-center print-no-bg w-full lg:w-[80%] mx-auto">
                    <h2 class="font-bold text-3xl text-slate-800 mb-2 text-center">પરિશિષ્ટ –9</h2>
                    <h3 class="font-bold text-xl text-slate-600 text-center">SNA લિમિટ મેળવણું (Limit Reconciliation)</h3>
                    <div class="text-base font-bold text-slate-700 mt-4 border-b-2 border-slate-800 pb-2 flex justify-between"><div class="text-left">વર્ષ : ${fyYear}</div><div class="text-center">School: ${escapeHtml(currentSchool.name)}</div><div class="text-right">Account: Virtual Limit (PFMS)</div></div>
                </div>
                <table class="tally-table border-2 border-slate-800 border-print w-full mx-auto text-sm lg:w-[80%]"><thead class="print-no-bg bg-slate-100 border-b-2 border-slate-800 border-print">
                <tr><th class="p-3 border-r border-slate-800 border-print text-sm">ક્રમ</th><th class="p-3 border-r border-slate-800 border-print text-sm">વિગત</th><th class="text-right p-3 border-r border-slate-800 border-print text-sm">પેટા રકમ</th><th class="text-right bg-indigo-50 print-no-bg p-3 text-sm border-print">કુલ રકમ</th></tr></thead><tbody>
                <tr class="border-b border-slate-400 border-print"><td class="p-3 border-r border-slate-400 border-print"></td><td class="font-bold text-indigo-700 p-3 text-base border-r border-slate-400 border-print text-left">રોજમેળ પ્રમાણે તા. ${openingBalDate} ની સિલક</td><td class="p-3 border-r border-slate-400 border-print"></td><td class="text-right font-bold p-3 text-base border-print">0.00</td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="font-bold text-emerald-600 p-3 text-base border-r border-slate-400 border-print text-center">(+)</td><td class="font-bold text-emerald-600 p-3 text-base border-r border-slate-400 border-print text-left">ઉમેરવું</td><td class="p-3 border-r border-slate-400 border-print"></td><td class="p-3 border-print"></td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="p-3 text-base text-center border-r border-slate-400 border-print">૧</td><td class="p-3 text-base border-r border-slate-400 border-print text-left">SNA ઓર્ડર જનરેટ થયો હોય પરંતુ PFMS માં સેટલ ન થયો હોય.</td><td class="text-right p-3 text-base border-r border-slate-400 border-print">0.00</td><td class="p-3 border-print"></td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="p-3 text-base text-center border-r border-slate-400 border-print">૨</td><td class="p-3 text-base border-r border-slate-400 border-print text-left">પોર્ટલ પર લિમિટ જમા થઇ હોય પરંતુ રોજમેળમાં દર્શાવેલ ન હોય.</td><td class="text-right p-3 text-base border-r border-slate-400 border-print">0.00</td><td class="text-right font-bold text-emerald-700 p-3 text-base border-print">0.00</td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="font-bold text-rose-600 p-3 text-base border-r border-slate-400 border-print text-center">(-)</td><td class="font-bold text-rose-600 p-3 text-base border-r border-slate-400 border-print text-left">બાદ કરવું.</td><td class="p-3 border-r border-slate-400 border-print"></td><td class="p-3 border-print"></td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="p-3 text-base text-center border-r border-slate-400 border-print">૧</td><td class="p-3 text-base border-r border-slate-400 border-print text-left">SNA માં ખર્ચ એડવાન્સ બુક કર્યો હોય પરંતુ પોર્ટલ પર પેમેન્ટ બાકી હોય.</td><td class="text-right p-3 text-base border-r border-slate-400 border-print">0.00</td><td class="p-3 border-print"></td></tr>
                <tr class="border-b border-slate-400 border-print"><td class="p-3 text-base text-center border-r border-slate-400 border-print">૨</td><td class="p-3 text-base border-r border-slate-400 border-print text-left">પોર્ટલ પર રકમ ડેબિટ (ઉધાર) થઈ હોય પરંતુ તે રોજમેળમાં ઉલ્લેખ થયેલ ન હોય.</td><td class="text-right p-3 text-base border-r border-slate-400 border-print">0.00</td><td class="text-right font-bold text-rose-600 p-3 text-base border-print">0.00</td></tr>
                <tr class="bg-indigo-50/50 print-no-bg border-t-2 border-slate-800 border-print"><td class="p-4 border-r border-slate-400 border-print"></td><td class="font-bold text-slate-800 text-xl p-4 border-r border-slate-400 border-print text-left">SNA / PFMS પોર્ટલ પ્રમાણે લિમિટ બેલેન્સ</td><td class="p-4 border-r border-slate-400 border-print"></td><td class="text-right font-black text-2xl text-emerald-600 p-4 border-print dyn-rem-amt">${formatINR(autoMotherSanction - expTotal)}</td></tr></tbody></table></div>`;
            }

            wrapper.innerHTML = html;
        } catch(e) {
            console.error("Report Generation Error: ", e);
            wrapper.innerHTML = `<div class="text-center py-16 font-bold text-rose-500">રિપોર્ટ બનાવતી વખતે ભૂલ આવી: ${e.message}</div>`;
        }
    }, 1);
}
