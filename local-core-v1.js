function goToMainMenu() { window.top.location.href = SCRIPT_URL + "?page=dashboard"; }
function switchToSnaSparsh() { 
    window.top.location.href = SCRIPT_URL + "?page=sna"; 
}
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

// 🟢 SMART DYNAMIC FINANCIAL YEAR ENGINE
let _today = new Date(); 
let _cYear = _today.getFullYear(); 
let _cMonth = _today.getMonth() + 1;
let _sYear = _cMonth < 4 ? _cYear - 1 : _cYear; 
let _eYear = _sYear + 1;

const fyYear = `${_sYear}-${String(_eYear).slice(-2)}`;
const closingBalDate = `31-03-${_eYear}`;

let currentSchoolName = "PM SHRI SCHOOL"; let currentUdise = "";
let instLabelGuj = "શાળાનું નામ"; 
let authSignLabel = "SMC અધ્યક્ષની સહી"; 
let localLedgerData = []; let currentReportType = 'cashbook';
let currentCashBalance = 0;

let cashbookStyle = 'ONE';
let localHeads = []; let localVendors = []; let localBanks = {};

// 🟢 SMART ACCOUNT TYPES ENGINE
let localAccountTypes = [];
const defaultAccountTypes = [
    { val: "SMCE", txt: "S.M.C.E. Account" },
    { val: "SHALAFUND", txt: "શાળા ફંડ (Shala Fund)" },
    { val: "CONTINGENCY", txt: "આકસ્મિક ખર્ચ (Contingency)" }
];

function loadAccountTypes() {
    try {
        let lsAcc = localStorage.getItem('pmShriAccountTypes_' + currentUdise);
        if (lsAcc) {
            localAccountTypes = JSON.parse(lsAcc);
            if (!localAccountTypes || localAccountTypes.length === 0) {
                localAccountTypes = [...defaultAccountTypes];
            }
        } else {
            localAccountTypes = [...defaultAccountTypes];
        }
    } catch (e) {
        localAccountTypes = [...defaultAccountTypes];
    }
    renderAccountTypesDropdown();
    renderAccountTypesSettings();
}

function renderAccountTypesDropdown() {
    let selectEl = document.getElementById('activeAccountType');
    if (!selectEl) return;

    let currentVal = selectEl.value;
    selectEl.innerHTML = '<option value="ALL_ACCOUNTS">🌐 ALL ACCOUNTS (Master View)</option>';

    localAccountTypes.forEach(acc => {
        let option = document.createElement('option');
        option.value = acc.val;
        option.innerText = acc.txt;
        selectEl.appendChild(option);
    });

    if (currentVal === "ALL_ACCOUNTS") {
        selectEl.value = "ALL_ACCOUNTS";
    } else if (localAccountTypes.find(a => a.val === currentVal)) {
        selectEl.value = currentVal;
    } else if (localAccountTypes.length > 0) {
        selectEl.value = localAccountTypes[0].val;
    }
}

function renderAccountTypesSettings() {
    let listEl = document.getElementById('localAccTypeList');
    if (!listEl) return;
    listEl.innerHTML = "";
    
    localAccountTypes.forEach(acc => {
        let safeVal = escapeHtml(acc.val);
        let safeTxt = escapeHtml(acc.txt);
        listEl.innerHTML += `<span class="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-teal-700 flex items-center gap-2 shadow-sm">${safeTxt} 
            <button onclick="removeLocalAccountType('${safeVal}')" class="text-rose-400 hover:text-rose-600"><i data-feather="x" style="width:12px;height:12px;"></i></button>
        </span>`;
    });
    try { feather.replace(); } catch(e){}
}

function saveLocalAccountType() {
    let txtVal = document.getElementById('txtLocalAccName').value.trim();
    if (!txtVal) return;
    
    let valKey = txtVal.toUpperCase().replace(/\s+/g, '_');
    
    if (!localAccountTypes.find(a => a.val === valKey)) {
        localAccountTypes.push({ val: valKey, txt: txtVal });
        localStorage.setItem('pmShriAccountTypes_' + currentUdise, JSON.stringify(localAccountTypes));
        
        renderAccountTypesDropdown();
        renderAccountTypesSettings();
        document.getElementById('txtLocalAccName').value = "";
        Toast.fire({icon: 'success', title: 'નવું ખાતું ઉમેરાઈ ગયું!'});
    } else {
        Swal.fire('Error', 'આ ખાતું પહેલાથી જ સિસ્ટમમાં છે.', 'error');
    }
}

function removeLocalAccountType(valKey) {
    if(localAccountTypes.length <= 1) {
        return Swal.fire('Error', 'ઓછામાં ઓછું એક ખાતું હોવું જરૂરી છે!', 'error');
    }
    if(document.getElementById('activeAccountType').value === valKey) {
        return Swal.fire('Warning', 'આ ખાતું હાલમાં ડેસ્કબોર્ડ પર સિલેક્ટ કરેલ છે. ડીલીટ કરતા પહેલા બીજું ખાતું સિલેક્ટ કરો.', 'warning');
    }
    
    localAccountTypes = localAccountTypes.filter(a => a.val !== valKey);
    localStorage.setItem('pmShriAccountTypes_' + currentUdise, JSON.stringify(localAccountTypes));
    renderAccountTypesDropdown();
    renderAccountTypesSettings();
    Toast.fire({icon: 'info', title: 'ખાતું ડીલીટ થઈ ગયું.'});
}

const DEFAULT_PMSHRI_LOGO = "https://i.ibb.co/8DsJSWWz/pm-shri-logo.jpg"; 
const DEFAULT_SSA_LOGO = "https://i.ibb.co/97B7MWw/samgrasiksha-cropped.png"; 

let logoSettings = { 
    schoolLogoUrl: "", useSchoolLogo: false, 
    pmShriLogoUrl: "", usePmShri: true, 
    ssaLogoUrl: "", useSsa: false,
    schoolNameGuj: "" 
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
    let saved = JSON.parse(localStorage.getItem('pmShriLogos_' + currentUdise));
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
    
    let txtGuj = document.getElementById('settingSchoolNameGuj');
    if(txtGuj) txtGuj.value = logoSettings.schoolNameGuj || "";
    
    if (logoSettings.schoolNameGuj) {
        currentSchoolName = logoSettings.schoolNameGuj;
        let uiEl = document.getElementById('uiSchoolName'); 
        if(uiEl) uiEl.innerText = currentSchoolName;
    }
    
    if(typeof feather !== 'undefined') feather.replace();
}

function saveLogoSettings() {
    logoSettings.schoolLogoUrl = document.getElementById('settingSchoolLogo').value;
    logoSettings.useSchoolLogo = document.getElementById('settingUseSchoolLogo').checked;
    
    logoSettings.pmShriLogoUrl = document.getElementById('settingPmShriLogo').value;
    logoSettings.usePmShri = document.getElementById('settingUsePmShriLogo').checked;
    
    logoSettings.ssaLogoUrl = document.getElementById('settingSsaLogo').value;
    logoSettings.useSsa = document.getElementById('settingUseSsaLogo').checked;
    
    let txtGuj = document.getElementById('settingSchoolNameGuj');
    if(txtGuj) {
        logoSettings.schoolNameGuj = txtGuj.value.trim();
        if (logoSettings.schoolNameGuj) {
            currentSchoolName = logoSettings.schoolNameGuj;
            let uiEl = document.getElementById('uiSchoolName'); 
            if(uiEl) uiEl.innerText = currentSchoolName;
        }
    }
    
    localStorage.setItem('pmShriLogos_' + currentUdise, JSON.stringify(logoSettings));
    Toast.fire({icon: 'success', title: 'તમામ લોગો અને સેટિંગ્સ સેવ થઈ ગયા!'});
}

function initTomSelect(el, optionsArray, placeholder, defaultValue="") {
    if(!el) return; 
    if(el.tomselect) el.tomselect.destroy();
    el.innerHTML = '<option value="">'+placeholder+'</option>';
    optionsArray.forEach(opt => { 
        let o = document.createElement('option'); 
        o.value = opt.val; o.innerText = opt.txt; 
        if(opt.val === defaultValue) o.selected = true; 
        el.appendChild(o); 
    });
    new TomSelect(el, { create: true, sortField: { field: "text", direction: "asc" } });
}

try { 
    let lsHeads = localStorage.getItem('pmShriLocalHeads');
    if(lsHeads) localHeads = JSON.parse(lsHeads); 
} catch(e) {}
if(!Array.isArray(localHeads) || localHeads.length === 0) localHeads = ['બેંક વ્યાજ', 'સ્ટેશનરી ખર્ચ', 'પ્રવાસ ખર્ચ', 'ચા-નાસ્તો', 'પરચૂરણ ખર્ચ', 'મજૂરી / રીપેરીંગ', 'પદર ખર્ચ ચૂકવ્યા પેટે'];

try { 
    let lsVendors = localStorage.getItem('pmShriLocalVendors');
    if(lsVendors) localVendors = JSON.parse(lsVendors); 
} catch(e) {}
if(!Array.isArray(localVendors)) localVendors = [];

document.addEventListener("DOMContentLoaded", () => {
    try { feather.replace(); } catch(e){}
    
    try {
        const savedDataStr = localStorage.getItem("pmShriAuthData");
        if(savedDataStr && savedDataStr !== "undefined" && savedDataStr !== "null") { 
            const savedData = JSON.parse(savedDataStr) || {}; 
            
            let userPlan = String(savedData.planType || "COMBO").toUpperCase().replace(/[\s_]/g, '');
            let userSchemes = String(savedData.schemeType || "").toUpperCase().replace(/[\s_]/g, '');
            
            let isDemo = userPlan.includes("DEMO") || userPlan.includes("₹0");
            let isLocalFundAllowed = userPlan.includes("LOCAL") || userPlan.includes("COMBO") || userPlan.includes("ALLINONE") || isDemo || userSchemes.includes("LOCAL");
            
            if (!isLocalFundAllowed) {
                let aside = document.querySelector('aside'); if(aside) aside.style.display = 'none';
                let main = document.querySelector('main'); if(main) main.style.display = 'none';
                
                Swal.fire({
                    title: 'મોડ્યુલ લોક છે 🔒',
                    html: `તમારો હાલનો પ્લાન <b>${savedData.planType || 'SNA Only'}</b> છે.<br><br>Local Fund મોડ્યુલ વાપરવા માટે તમારા પ્લાનને <b>COMBO</b> માં અપગ્રેડ કરો.`,
                    icon: 'error',
                    confirmButtonColor: '#e11d48',
                    confirmButtonText: 'પાછા જાઓ (Go Back)',
                    allowOutsideClick: false
                }).then(() => {
                    window.top.location.href = SCRIPT_URL + "?page=dashboard"; 
                });
                return; 
            }

            let btnSwitch = document.querySelector('button[onclick="switchToSnaSparsh()"]');
            if (btnSwitch) {
                let hasSna = userPlan.includes("COMBO") || userPlan.includes("ALLINONE") || isDemo || userPlan.includes("PMSHRI") || userPlan.includes("SSA") || userSchemes.includes("GJ302") || userSchemes.includes("GJ209");
                if (!hasSna) {
                    btnSwitch.style.display = 'none'; 
                } else {
                    btnSwitch.style.display = 'flex';
                }
            }

            let badgeContainer = document.getElementById('planDisplayBadge');
            if (badgeContainer) {
                if (isDemo) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase animate-pulse inline-block">⏳ 3-DAY DEMO</span>`;
                else if (userPlan.includes("ALLINONE")) badgeContainer.innerHTML = `<span class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-widest uppercase inline-block">⭐ ALL IN ONE PRO</span>`;
            }

            let sType = String(savedData.schemeType || "").toUpperCase();
            let authSignLabel = "SMC અધ્યક્ષ ની સહી સિક્કો";

            if (sType.includes("BRC")) { instLabelGuj = "BRC ભવનનું નામ"; authSignLabel = "BRC Co-ordinator ની સહી"; }
            else if (sType.includes("CRC")) { instLabelGuj = "CRC ભવનનું નામ"; authSignLabel = "CRC Co-ordinator ની સહી"; }
            else if (sType.includes("URC")) { instLabelGuj = "URC ભવનનું નામ"; authSignLabel = "URC Co-ordinator ની સહી"; }
            else if (sType.includes("HIGH_SCHOOL")) { instLabelGuj = "શાળાનું નામ"; authSignLabel = "SMDC અધ્યક્ષની સહી"; }
            else if (sType.includes("KGBV")) { instLabelGuj = "KGBV નું નામ"; authSignLabel = "વોર્ડન / આચાર્યની સહી"; }
            else { instLabelGuj = "શાળાનું નામ"; authSignLabel = "SMC અધ્યક્ષની સહી"; }

            let setLabel = document.getElementById('lblSettingsInstName');
            if(setLabel) setLabel.innerText = instLabelGuj + " (રિપોર્ટ્સમાં છાપવા માટે)";

            let signEl = document.getElementById('pvSignAuthority');
            if(signEl) signEl.innerText = authSignLabel;

            currentSchoolName = savedData.name || "PM SHRI SCHOOL"; 
            currentUdise = savedData.udise || "";
        }
        
        let uiEl = document.getElementById('uiSchoolName'); if(uiEl) uiEl.innerText = currentSchoolName;
        let pvEl = document.getElementById('pvSchoolName2'); if(pvEl) pvEl.innerText = currentSchoolName;
    } catch(e) { console.error("Data Load Error:", e); }
    
    try {
        let bStr = localStorage.getItem(`pmShriBanks_${currentUdise}`);
        if (!bStr) bStr = localStorage.getItem(`pmShriBanks_`);
        if (bStr) { localBanks = JSON.parse(bStr); }
    } catch(e) { console.error("Bank Load Error", e); }
    
    let vDateEl = document.getElementById('vDate'); if(vDateEl) vDateEl.valueAsDate = new Date();
    
    loadAccountTypes(); 
    renderMasters(); 
    loadLogoSettings();
    
    setTimeout(() => {
        changeAccountType(); 
    }, 100);
    
    let chipsGu = document.getElementById('monthFilterChips');
    if(chipsGu) {
        const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        let html = `<label class="cursor-pointer"><input type="checkbox" id="selectAllMonths" onchange="toggleAllMonths(this)" checked class="hidden peer"><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 peer-checked:bg-emerald-600 peer-checked:text-white transition shadow-sm border border-slate-200 peer-checked:border-emerald-600">બધા જ (All)</div></label>`;
        
        months.forEach(m => {
            let val = m.toLowerCase();
            html += `<label class="cursor-pointer"><input type="checkbox" value="${val}" class="hidden peer month-chk" onchange="updateMonthSelection()" checked><div class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition shadow-sm border border-slate-200 peer-checked:border-emerald-300">${m}</div></label>`;
        });
        chipsGu.innerHTML = html;
    }
});

const formatINR = (amt) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

const escapeHtml = (unsafe) => {
    if(unsafe === null || unsafe === undefined) return "";
    return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

function getGujaratiWords(n) {
    if (isNaN(n) || n===0) return "શૂન્ય રૂપિયા";
    const m={1:"એક",2:"બે",3:"ત્રણ",4:"ચાર",5:"પાંચ",6:"છ",7:"સાત",8:"આઠ",9:"નવ",10:"દસ",11:"અગિયાર",12:"બાર",13:"તેર",14:"ચૌદ",15:"પંદર",16:"સોળ",17:"સત્તર",18:"અઢાર",19:"ઓગણીસ",20:"વીસ",21:"એકવીસ",22:"બાવીસ",23:"ત્રેવીસ",24:"ચોવીસ",25:"પચ્ચીસ",26:"છવ્વીસ",27:"સત્તાવીસ",28:"અઠ્ઠાવીસ",29:"ઓગણત્રીસ",30:"ત્રીસ",31:"એકત્રીસ",32:"બત્રીસ",33:"તેંત્રીસ",34:"ચોત્રીસ",35:"પાંત્રીસ",36:"છત્રીસ",37:"સાડત્રીસ",38:"આડત્રીસ",39:"ઓગણચાળીસ",40:"ચાળીસ",41:"એકતાળીસ",42:"બેતાળીસ",43:"તેતાળીસ",44:"ચુમ્માળીસ",45:"પિસ્તાળીસ",46:"છેંતાળીસ",47:"સુડતાળીસ",48:"અડતાળીસ",49:"ઓગણપચાસ",50:"પચાસ",51:"એકાવન",52:"બાવન",53:"ત્રેપન",54:"ચોપન",55:"પંચાવન",56:"છપ્પન",57:"સત્તાવન",58:"અઠ્ઠાવન",59:"ઓગણસાઠ",60:"સાઠ",61:"એકસઠ",62:"બાસઠ",63:"ત્રેસઠ",64:"ચોસઠ",65:"પાંસઠ",66:"છાસઠ",67:"સડસઠ",68:"અડસઠ",69:"ઓગણસિત્તેર",70:"સિત્તેર",71:"ઈકોતેર",72:"બોતેર",73:"તોત્તેર",74:"ચુંબોતેર",75:"પંચોતેર",76:"છોત્તેર",77:"સિત્યોત્તર",78:"ઈઠયોતેર",79:"ઓગણએંસી",80:"એંસી",81:"એક્યાશી",82:"બ્યાશી",83:"ત્યાંશી",84:"ચોર્યાશી",85:"પંચ્યાશી",86:"છ્યાંશી",87:"સિત્યાસી",88:"ઈઠ્યાસી",89:"નેવ્યાસી",90:"નેવું",91:"એકાણું",92:"બાણું",93:"ત્રાણું",94:"ચોરાણું",95:"પંચાણું",96:"છન્નું",97:"સતાણું",98:"અઠ્ઠાણું",99:"નવ્વાણું"};
    const hWords = {1:"એક સો", 2:"બસો", 3:"ત્રણસો", 4:"ચારસો", 5:"પાંચસો", 6:"છસો", 7:"સાતસો", 8:"આઠસો", 9:"નવસો"};
    let r=""; const cr=Math.floor(n/10000000); if(cr>0){r+=getGujaratiWords(cr)+" કરોડ ";n%=10000000;}
    const l=Math.floor(n/100000); if(l>0){r+=getGujaratiWords(l)+" લાખ ";n%=100000;}
    const t=Math.floor(n/1000); if(t>0){r+=getGujaratiWords(t)+" હજાર ";n%=1000;}
    const h=Math.floor(n/100); if(h>0){r+=hWords[h]+" ";n%=100;}
    if(n>0) r+=(m[n]||"")+" "; return r.trim();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el => el.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition hover:bg-slate-800 hover:text-white font-medium text-slate-300");
    
    const dtBtn = document.getElementById('dt-' + tabId);
    if(dtBtn) {
        dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-emerald-600 shadow-md";
        if(tabId === 'accounting' || tabId === 'settings' || tabId === 'manage' || tabId === 'registers') {
            dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-slate-800 shadow-md mt-4 border-t border-slate-800 pt-4";
            if(tabId === 'accounting') dtBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-bold text-white bg-amber-500 shadow-md mt-4 border-t border-slate-800 pt-4";
        }
    }
    
    document.querySelectorAll('.mobile-nav-btn').forEach(el => { 
        el.classList.remove('text-emerald-600', 'text-amber-500', 'text-indigo-600'); 
        el.classList.add('text-slate-400'); 
    });
    const mbBtn = document.getElementById('mb-' + tabId);
    if(mbBtn) { 
        mbBtn.classList.remove('text-slate-400'); 
        if(tabId === 'accounting') mbBtn.classList.add('text-amber-500'); 
        else if(tabId === 'registers') mbBtn.classList.add('text-indigo-600');
        else mbBtn.classList.add('text-emerald-600'); 
    }
    
    if(tabId === 'accounting') { setTimeout(() => { generateAccountingReport(); }, 100); }
    if(tabId === 'manage') { document.getElementById('manageTableView').classList.remove('hidden'); document.getElementById('manageEditFormView').classList.add('hidden'); }
    if(tabId === 'registers') { setTimeout(() => { switchRegisterView('meetings'); }, 100); }
    window.scrollTo(0, 0);
}

function fillDefaultVoucherText(prefix) {
    let modeEl = document.querySelector(`input[name="${prefix === 'e' ? 'ePayMode' : 'payMode'}"]:checked`);
    let mode = modeEl ? modeEl.value : 'BANK';
    let modeTxt = mode === 'CASH' ? 'રોકડા' : 'બેંક ખાતામાં';
    let txt = `બા.જે. આજ રોજ મને ${currentSchoolName} તરફથી ____________________ માટે ચૂકવ્યા તે રકમ ${modeTxt} મળેલ છે. જે બદલ વાઉચર આપવામાં આવે છે.`;
    document.getElementById(`${prefix}VoucherText`).value = txt;
}

function getMonthKey(dateStr) {
    try {
        if(!dateStr || dateStr === "-") return "ALL";
        let dStr = String(dateStr).trim().replace(/\//g, '-'); 
        let parts = dStr.split('-');
        if(parts.length >= 2) {
            let mStr = parts[0].length === 4 ? parts[1] : parts[1];
            mStr = mStr.toLowerCase();
            if(isNaN(mStr)) { return mStr.substring(0,3); } 
            else {
                let mNum = parseInt(mStr, 10);
                const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                if(mNum >= 1 && mNum <= 12) return monthNames[mNum - 1];
            }
        }
    } catch(e) {}
    return "ALL";
}

function toggleAllMonths(source) {
    let chks = document.querySelectorAll('.month-chk');
    chks.forEach(chk => { chk.checked = source.checked; });
    updateMonthSelection();
}

function updateMonthSelection() {
    let chks = document.querySelectorAll('.month-chk');
    let allChecked = true;
    chks.forEach(chk => { if(!chk.checked) allChecked = false; });
    document.getElementById('selectAllMonths').checked = allChecked;
    if(document.getElementById('tab-accounting').classList.contains('active')) generateAccountingReport();
}

function changeAccountType() {
    const accTypeEl = document.getElementById('activeAccountType');
    if(!accTypeEl) return;
    const accType = accTypeEl.value;

    let sbEl = document.getElementById('sbAccDisplay'); if(sbEl) sbEl.innerText = accType === "ALL_ACCOUNTS" ? "MASTER VIEW" : accType + " A/C";
    let bdEl = document.getElementById('bankAccBadge'); if(bdEl) bdEl.innerText = accType === "ALL_ACCOUNTS" ? "MASTER VIEW" : accType;

    let dtVoucher = document.getElementById('dt-voucher'); let mbVoucher = document.getElementById('mb-voucher');
    if (accType === "ALL_ACCOUNTS") {
        if(dtVoucher) dtVoucher.style.display = "none";
        if(mbVoucher) mbVoucher.style.display = "none";
        if(document.getElementById('tab-voucher').classList.contains('active')) switchTab('dashboard');
    } else {
        if(dtVoucher) dtVoucher.style.display = "flex";
        if(mbVoucher) mbVoucher.style.display = "flex";
        
        try { let bStr = localStorage.getItem(`pmShriBanks_${currentUdise}`); if (bStr) localBanks = JSON.parse(bStr); } catch(e) {}
        let bankObj = localBanks[accType] || { name: "", branch: "", accNo: "", ifsc: "" };
        let bN = document.getElementById('bName'); if(bN) bN.value = bankObj.name || "";
        let bB = document.getElementById('bBranch'); if(bB) bB.value = bankObj.branch || "";
        let bA = document.getElementById('bAccNo'); if(bA) bA.value = bankObj.accNo || "";
        let bI = document.getElementById('bIfsc'); if(bI) bI.value = bankObj.ifsc || "";
    }

    loadLedger();
}

function saveBankDetails() {
    const accType = document.getElementById('activeAccountType').value;
    if(!accType) return Swal.fire('Error', 'પહેલા ખાતાનો પ્રકાર (Account Type) સિલેક્ટ કરો!', 'error');
    
    let bankObj = { 
        name: document.getElementById('bName').value.trim().toUpperCase(), 
        branch: document.getElementById('bBranch').value.trim().toUpperCase(), 
        accNo: document.getElementById('bAccNo').value.trim(), 
        ifsc: document.getElementById('bIfsc').value.trim().toUpperCase() 
    };
    
    localBanks[accType] = bankObj; 
    localStorage.setItem(`pmShriBanks_${currentUdise}`, JSON.stringify(localBanks)); 
    Toast.fire({icon: 'success', title: 'Bank Details Saved Successfully!'});
}

function saveLocalHead() {
    let val = document.getElementById('txtLocalHead').value.trim(); if(!val) return;
    if(!localHeads.includes(val)) { localHeads.push(val); localStorage.setItem('pmShriLocalHeads', JSON.stringify(localHeads)); }
    document.getElementById('txtLocalHead').value = ""; renderMasters(); Toast.fire({icon: 'success', title: 'હેડ સેવ થઈ ગયો!'});
}

function removeLocalHead(val) { localHeads = localHeads.filter(h => h !== val); localStorage.setItem('pmShriLocalHeads', JSON.stringify(localHeads)); renderMasters(); }

function saveOpeningBalFromSettings() {
    let date = document.getElementById('obDate').value;
    let head = document.getElementById('obHead').value;
    let amt = parseFloat(document.getElementById('obAmt').value) || 0;
    if(!date || !head || amt <= 0) return Swal.fire('Error', 'તમામ વિગતો ભરો', 'error');
    
    let btn = document.getElementById('obSaveBtn'); let orig = btn.innerText; btn.innerText = "Saving..."; btn.disabled = true;
    
    const payload = { 
        accountType: document.getElementById('activeAccountType').value, type: 'INCOME', 
        date: date, voucherNo: "OB", payeeName: "શ્રી ઉઘડતી સિલક", purposeHead: head, chequeNo: "-", amount: amt 
    };
    google.script.run.withSuccessHandler(res => {
        btn.innerText = orig; btn.disabled = false;
        Swal.fire('Success', 'ઉઘડતી સિલક સેવ થઈ ગઈ!', 'success');
        document.getElementById('obAmt').value = ""; loadLedger();
    }).withFailureHandler(err => {
        btn.innerText = orig; btn.disabled = false; Swal.fire('Error', err.message, 'error');
    }).saveLocalVoucher(payload);
}

function renderMasters() {
    try {
        let hUI = document.getElementById('localHeadsList'); 
        if(hUI) hUI.innerHTML = ""; 
        
        let vOptions = localVendors.map(v => {
            let name = typeof v === 'object' ? (v.name || 'Unknown') : String(v);
            return {val: escapeHtml(name), txt: escapeHtml(name)};
        });
        let hOptions = localHeads.map(h => ({val: escapeHtml(h), txt: escapeHtml(h)}));

        initTomSelect(document.getElementById('vPayee'), vOptions, "-- પાર્ટી પસંદ કરો --");
        initTomSelect(document.getElementById('ePayee'), vOptions, "-- પાર્ટી પસંદ કરો --");
        initTomSelect(document.getElementById('vPurpose'), hOptions, "-- હેડ પસંદ કરો --");
        initTomSelect(document.getElementById('ePurpose'), hOptions, "-- હેડ પસંદ કરો --");
        
        let obHead = document.getElementById('obHead');
        if(obHead) {
            obHead.innerHTML = '<option value="">-- હેડ પસંદ કરો --</option>';
            localHeads.forEach(h => { if(h) obHead.innerHTML += `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`; });
        }

        localHeads.forEach(h => { 
            if (!h) return;
            let safeH = escapeHtml(h);
            if(hUI) hUI.innerHTML += `<span class="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 flex items-center gap-2 shadow-sm">${safeH} <button onclick="removeLocalHead('${safeH}')" class="text-rose-400 hover:text-rose-600"><i data-feather="x" style="width:12px;height:12px;"></i></button></span>`; 
        });
        
        let headSelect = document.getElementById('accBudgetHead');
        if(headSelect) { 
            headSelect.innerHTML = '<option value="ALL">All Heads</option>'; 
            localHeads.forEach(h => { 
                if(h) headSelect.innerHTML += `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`; 
            }); 
        }
        
        let vendorSelect = document.getElementById('accVendorSelect');
        if(vendorSelect) { 
            vendorSelect.innerHTML = '<option value="ALL">All Parties</option>'; 
            localVendors.forEach(v => { 
                if(v) vendorSelect.innerHTML += `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`; 
            }); 
        }
        
        try { feather.replace(); } catch(e){}
    } catch (e) { console.error("renderMasters Error", e); }
}

function setEntryType(type) {
    let etEl = document.getElementById('entryType'); if(etEl) etEl.value = type;
    const btnInc = document.getElementById('btnIncome'); const btnExp = document.getElementById('btnExpense'); 
    const lblPayee = document.getElementById('lblPayee'); const billSec = document.getElementById('billSection');
    
    if(!btnInc || !btnExp || !lblPayee) return;
    
    if(type === 'INCOME') {
        btnInc.className = "flex-1 py-3 rounded-xl font-bold text-sm bg-white text-emerald-600 shadow-sm border border-emerald-200 transition-all"; 
        btnExp.className = "flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:text-rose-600 transition-all";
        lblPayee.innerHTML = `<span>કોના તરફથી મળ્યા? *</span>`;
        let lvEl = document.getElementById('lblVchNo'); if(lvEl) lvEl.innerText = "પહોંચ નં. (Receipt No.)"; 
        if(billSec) billSec.classList.add('hidden');
    } else {
        btnExp.className = "flex-1 py-3 rounded-xl font-bold text-sm bg-white text-rose-600 shadow-sm border border-rose-200 transition-all"; 
        btnInc.className = "flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:text-emerald-600 transition-all";
        lblPayee.innerHTML = `<span>કોને ચૂકવ્યા? (Party/Vendor) *</span>`;
        let lvEl = document.getElementById('lblVchNo'); if(lvEl) lvEl.innerText = "વાઉચર નં. (Vch No.)"; 
        if(billSec) billSec.classList.remove('hidden');
    } 
}

function toggleBillInput() {
    let hbEl = document.getElementById('vHasBill');
    let bwEl = document.getElementById('billNoWrapper');
    if(!hbEl || !bwEl) return;
    if(hbEl.checked) { bwEl.classList.remove('hidden'); } 
    else { bwEl.classList.add('hidden'); }
}

function toggleChequeInput() {
    let modeEl = document.querySelector('input[name="payMode"]:checked');
    let cbwEl = document.getElementById('chequeBoxWrapper');
    if(!modeEl || !cbwEl) return;
    if(modeEl.value === 'CASH') cbwEl.classList.add('hidden');
    else cbwEl.classList.remove('hidden');
}

function toggleEditChequeInput() {
    let modeEl = document.querySelector('input[name="ePayMode"]:checked');
    let cbwEl = document.getElementById('eChequeBoxWrapper');
    if(!modeEl || !cbwEl) return;
    if(modeEl.value === 'CASH') cbwEl.classList.add('hidden');
    else cbwEl.classList.remove('hidden');
}

function generateWords(inputId, outputId) {
    let iEl = document.getElementById(inputId);
    let oEl = document.getElementById(outputId);
    if(!iEl || !oEl) return;
    let val = parseFloat(iEl.value) || 0;
    oEl.innerText = val > 0 ? getGujaratiWords(val) + " પૂરા" : "";
}

let manageCurrentPage = 1;
const MANAGE_PER_PAGE = 30;
let filteredManageData = [];

function filterManageTable() {
    let input = document.getElementById("searchManage");
    let query = input ? input.value.toLowerCase().trim() : "";
    
    if (!query) {
        filteredManageData = localLedgerData.filter(r => r.id !== "OPENING-BAL");
    } else {
        filteredManageData = localLedgerData.filter(r => {
            if (r.id === "OPENING-BAL") return false;
            let searchStr = `${r.date} ${r.voucherNo} ${r.payeeName} ${r.purposeHead} ${r.income} ${r.expense}`.toLowerCase();
            return searchStr.includes(query);
        });
    }
    renderManageTable(1);
}

function renderManageTable(page = 1) {
    let tbody = document.getElementById('manageTableBody');
    let pagContainer = document.getElementById('managePagination');
    if(!tbody) return;
    
    manageCurrentPage = page;
    
    if (!document.getElementById("searchManage")?.value && filteredManageData.length === 0 && localLedgerData.length > 0) {
        filteredManageData = localLedgerData.filter(r => r.id !== "OPENING-BAL");
    }

    tbody.innerHTML = '';
    if(filteredManageData.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 font-bold text-slate-400">કોઈ ડેટા ઉપલબ્ધ નથી.</td></tr>`; 
        if(pagContainer) pagContainer.innerHTML = '';
        return; 
    }

    let totalPages = Math.ceil(filteredManageData.length / MANAGE_PER_PAGE) || 1;
    if (manageCurrentPage > totalPages) manageCurrentPage = totalPages;
    let startIdx = (manageCurrentPage - 1) * MANAGE_PER_PAGE;
    let chunkData = filteredManageData.slice(startIdx, startIdx + MANAGE_PER_PAGE);

    chunkData.forEach(r => {
        let inc = parseFloat(r.income) || 0; let exp = parseFloat(r.expense) || 0;
        let isInc = inc > 0; let amt = isInc ? inc : exp;
        let colorClass = isInc ? 'text-emerald-600' : 'text-rose-600';

        let rawHead = String(r.purposeHead || ""); 
        let p = rawHead.split(" || ");
        let headPart = escapeHtml(p[0] || "-"); 
        let remarkPart = escapeHtml(p[1] || "");

        let safePayeeName = escapeHtml(r.payeeName);
        let safeDate = escapeHtml(r.date);
        let safeVch = escapeHtml(r.voucherNo) + (r.accSource ? `<br><span class="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1 inline-block">${r.accSource}</span>` : "");

        let tr = `<tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-3 font-bold text-slate-700 whitespace-nowrap">${safeDate}</td>
            <td class="p-3 font-mono text-indigo-700 text-xs whitespace-nowrap">${safeVch}</td>
            <td class="p-3 font-bold text-slate-800 whitespace-nowrap">${safePayeeName}</td>
            <td class="p-3"><div class="font-bold text-slate-700 whitespace-nowrap">${headPart}</div><div class="text-[10px] text-slate-500 whitespace-nowrap">${remarkPart}</div></td>
            <td class="p-3 font-black text-right ${colorClass} whitespace-nowrap">${formatINR(amt)}</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="duplicateVoucher('${r.id}')" title="Duplicate" class="text-amber-600 hover:text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg shadow-sm mr-1"><i data-feather="copy" class="w-3 h-3"></i></button>
                <button onclick="printVoucherFromRecordId('${r.id}')" title="Print" class="text-emerald-600 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg shadow-sm mr-1"><i data-feather="printer" class="w-3 h-3"></i></button>
                <button onclick="openEditTabById('${r.id}')" title="Edit" class="text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 p-1.5 rounded-lg shadow-sm mr-1"><i data-feather="edit-2" class="w-3 h-3"></i></button>
                <button onclick="deleteVoucherRecord('${r.id}')" title="Delete" class="text-slate-400 hover:text-rose-600 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm"><i data-feather="trash-2" class="w-3 h-3"></i></button>
            </td>
        </tr>`;
        tbody.innerHTML += tr;
    });

    if(pagContainer) {
        pagContainer.innerHTML = '';
        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                let activeCls = i === manageCurrentPage ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200';
                pagContainer.innerHTML += `<button onclick="renderManageTable(${i})" class="px-3 py-1.5 rounded-lg text-sm font-bold border shadow-sm transition ${activeCls}">${i}</button>`;
            }
        }
    }
    try { feather.replace(); } catch(e){}
}

function duplicateVoucher(id) {
    let r = localLedgerData.find(x => x.id === id);
    if(!r) return;
    
    switchTab('voucher');
    
    document.getElementById('vDate').valueAsDate = new Date();
    document.getElementById('vNo').value = ""; 
    
    let isInc = parseFloat(r.income) > 0;
    setEntryType(isInc ? 'INCOME' : 'EXPENSE');
    
    let payeeTs = document.getElementById('vPayee').tomselect;
    if(payeeTs) { payeeTs.addOption({val: r.payeeName, txt: r.payeeName}); payeeTs.setValue(r.payeeName); }
    
    let parts = String(r.purposeHead || "").split(" || ");
    let purposeTs = document.getElementById('vPurpose').tomselect;
    if(purposeTs) { purposeTs.addOption({val: parts[0], txt: parts[0]}); purposeTs.setValue(parts[0]); }
    
    document.getElementById('vRemarks').value = parts[1] || "";
    document.getElementById('vAddress').value = parts[2] || "";
    document.getElementById('vVoucherText').value = parts[3] || "";
    
    let amt = isInc ? parseFloat(r.income) : parseFloat(r.expense);
    document.getElementById('vAmt').value = amt;
    generateWords('vAmt', 'vAmtWords');
    
    Toast.fire({icon: 'info', title: 'જૂની વિગતો કોપી થઈ ગઈ છે. નવી એન્ટ્રી સેવ કરો.'});
}

function openEditTabById(id) {
    let r = localLedgerData.find(x => x.id === id);
    if(!r) return;

    let mtEl = document.getElementById('manageTableView'); if(mtEl) mtEl.classList.add('hidden');
    let mefEl = document.getElementById('manageEditFormView'); if(mefEl) mefEl.classList.remove('hidden');
    window.scrollTo(0, 0);
    
    let eTxnIdEl = document.getElementById('eTxnId'); if(eTxnIdEl) eTxnIdEl.value = r.id;
    
    let dParts = String(r.date).split('-');
    let eDateEl = document.getElementById('eDate');
    if(eDateEl && dParts.length === 3) {
        if(dParts[0].length !== 4) eDateEl.value = dParts.reverse().join('-');
        else eDateEl.value = r.date;
    }
    
    let eNoEl = document.getElementById('eNo'); if(eNoEl) eNoEl.value = r.voucherNo;
    
    let payee = r.payeeName;
    let tsPayee = document.getElementById('ePayee').tomselect;
    if(tsPayee) {
        tsPayee.addOption({val: payee, txt: payee});
        tsPayee.setValue(payee);
    }
    
    let parts = String(r.purposeHead || "").split(" || ");
    let headPart = parts[0] || "";
    let remarkPart = parts[1] || "";
    let addressPart = parts[2] || "";
    let textPart = parts[3] || "";
    
    if(remarkPart.includes(" (Bill:")) { remarkPart = remarkPart.split(" (Bill:")[0].trim(); } 
    
    let tsPurpose = document.getElementById('ePurpose').tomselect;
    if(tsPurpose) {
        tsPurpose.addOption({val: headPart, txt: headPart});
        tsPurpose.setValue(headPart);
    }
    
    let eRemEl = document.getElementById('eRemarks'); if(eRemEl) eRemEl.value = remarkPart;
    let eAddEl = document.getElementById('eAddress'); if(eAddEl) eAddEl.value = addressPart;
    let eVtEl = document.getElementById('eVoucherText'); if(eVtEl) eVtEl.value = textPart;
    
    let inc = parseFloat(r.income) || 0;
    let exp = parseFloat(r.expense) || 0;
    let isInc = inc > 0;
    
    let eTypeEl = document.getElementById('eType'); if(eTypeEl) eTypeEl.value = isInc ? 'INCOME' : 'EXPENSE';
    let eAmtEl = document.getElementById('eAmt'); if(eAmtEl) eAmtEl.value = isInc ? inc : exp;
    generateWords('eAmt', 'eAmtWords');
    
    let chq = r.chequeNo;
    if(chq && String(chq).includes("[CASH]")) {
        let rdCash = document.querySelector('input[name="ePayMode"][value="CASH"]'); if(rdCash) rdCash.checked = true;
        let eChqEl = document.getElementById('eCheque'); if(eChqEl) eChqEl.value = "";
    } else {
        let rdBank = document.querySelector('input[name="ePayMode"][value="BANK"]'); if(rdBank) rdBank.checked = true;
        let eChqEl = document.getElementById('eCheque'); if(eChqEl) eChqEl.value = chq === "-" ? "" : chq;
    }
    toggleEditChequeInput();
}

function closeEditForm() {
    let mtEl = document.getElementById('manageTableView'); if(mtEl) mtEl.classList.remove('hidden');
    let mefEl = document.getElementById('manageEditFormView'); if(mefEl) mefEl.classList.add('hidden');
    let eTxnIdEl = document.getElementById('eTxnId'); if(eTxnIdEl) eTxnIdEl.value = "";
}

function submitEditVoucher() {
    let id = document.getElementById('eTxnId').value;
    let enteredPayee = document.getElementById('ePayee').value.trim().toUpperCase(); 
    let headMain = document.getElementById('ePurpose').value.trim();
    let headRemarks = document.getElementById('eRemarks').value.trim();
    let address = document.getElementById('eAddress').value.trim();
    let voucherText = document.getElementById('eVoucherText').value.trim();

    let dateVal = document.getElementById('eDate').value; 
    let amtVal = parseFloat(document.getElementById('eAmt').value) || 0;
    let mode = document.querySelector('input[name="ePayMode"]:checked').value;
    let chequeRaw = document.getElementById('eCheque').value.trim();
    let type = document.getElementById('eType').value;
    
    if(!dateVal || !enteredPayee || !headMain || amtVal <= 0) return Swal.fire('Error', 'તમામ વિગતો ભરો', 'error');

    let combinedPurpose = [headMain, headRemarks, address, voucherText].join(" || ");
    let finalChequeNo = mode === 'CASH' ? "[CASH]" : (chequeRaw || "-");

    const payload = { 
        accountType: document.getElementById('activeAccountType').value, txnId: id, type: type, date: dateVal, 
        voucherNo: document.getElementById('eNo').value, payeeName: enteredPayee, purposeHead: combinedPurpose, 
        chequeNo: finalChequeNo, amount: amtVal 
    };
    
    let btn = document.getElementById('editSaveBtn'); let origHtml = "";
    if(btn) { origHtml = btn.innerHTML; btn.innerHTML = '<i data-feather="loader" class="animate-spin inline w-5 h-5"></i> Updating...'; btn.disabled = true; }

    google.script.run.withSuccessHandler(resResponse => {
        if(btn) { btn.innerHTML = origHtml; btn.disabled = false; }
        let res = typeof resResponse === 'string' ? JSON.parse(resResponse) : resResponse;
        if(res.success) {
            Swal.fire('Success', 'એન્ટ્રી અપડેટ થઈ ગઈ!', 'success');
            localforage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
            localStorage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
            closeEditForm(); loadLedger();
        } else { Swal.fire('Error', res.message || 'Unknown Error', 'error'); }
    }).withFailureHandler(err => { 
        if(btn) { btn.innerHTML = origHtml; btn.disabled = false; }
        Swal.fire('Error', err.toString(), 'error'); 
    }).updateLocalVoucher(payload);
}

function deleteVoucherRecord(id) {
    Swal.fire({
        title: 'શું તમે ખરેખર ડીલીટ કરવા માંગો છો?', text: "આ એન્ટ્રી કાયમ માટે ડીલીટ થઈ જશે!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'હા, ડીલીટ કરો!'
    }).then((result) => {
        if (result.isConfirmed) {
            const payload = { accountType: document.getElementById('activeAccountType').value, txnId: id };
            google.script.run.withSuccessHandler(resResponse => {
                let res = typeof resResponse === 'string' ? JSON.parse(resResponse) : resResponse;
                if(res.success) { 
                    Swal.fire('Deleted!', 'એન્ટ્રી ડીલીટ થઈ ગઈ.', 'success'); 
                    localforage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                    localStorage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                    loadLedger(); 
                } 
                else { Swal.fire('Error', res.message || 'Unknown Error', 'error'); }
            }).withFailureHandler(err => {
                Swal.fire('Error', err.toString(), 'error'); 
            }).deleteLocalVoucher(payload);
        }
    });
}

function checkTdsAndSubmit() {
    let type = document.getElementById('entryType').value;
    let amtVal = parseFloat(document.getElementById('vAmt').value) || 0;
    let enteredPayee = document.getElementById('vPayee').value.trim();

    if (type === 'EXPENSE' && amtVal >= 30000) {
        Swal.fire({
            title: '⚠️ TDS કપાત (194C)',
            text: `આ બિલની રકમ ₹30,000 થી વધુ છે. શું તમે આ પાર્ટી ના બિલમાંથી TDS કાપવા માંગો છો? જો હા, તો તેમનો PAN નંબર નાખો:`,
            input: 'text',
            inputPlaceholder: 'દા.ત. ABCDE1234F',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'TDS ગણો',
            cancelButtonText: 'ના (સીધું સેવ કરો)',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#cbd5e1',
            inputValidator: (value) => {
                if (value) {
                    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                    if (!panRegex.test(value.toUpperCase())) {
                        return 'કૃપા કરીને સાચા ફોર્મેટમાં PAN નંબર નાખો!';
                    }
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                processTDSCalculationForLocal(amtVal, result.value.toUpperCase());
            } else if (result.dismiss === Swal.DismissReason.cancel || (result.isConfirmed && !result.value)) {
                submitVoucher(); 
            }
        });
    } else {
        submitVoucher();
    }
}

function processTDSCalculationForLocal(grossAmount, pan) {
    let fourthLetter = pan.charAt(3);
    let tdsPercent = 2; 
    let vendorType = "કંપની / ફર્મ (Company/Firm)";

    if (fourthLetter === 'P' || fourthLetter === 'H') {
        tdsPercent = 1;
        vendorType = "વ્યક્તિગત (Individual/HUF)";
    }

    let tdsAmount = Math.round(grossAmount * (tdsPercent / 100));
    let netAmount = grossAmount - tdsAmount;

    Swal.fire({
        title: '✅ TDS ગણતરી',
        html: `<b>PAN:</b> ${pan} <br>
               <b>પ્રકાર:</b> ${vendorType} <br>
               <b>કપાત:</b> ${tdsPercent}% <br><br>
               <b>TDS રકમ:</b> ₹ ${tdsAmount} <br>
               <b>ચૂકવવાપાત્ર (Net):</b> ₹ ${netAmount} <br><br>
               શું તમે આ TDS કાપવા માંગો છો?`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'હા, કાપો અને સેવ કરો',
        cancelButtonText: 'રદ કરો',
        confirmButtonColor: '#10b981'
    }).then((result) => {
        if (result.isConfirmed) {
            executeTdsSplitSave(grossAmount, tdsAmount, netAmount, pan);
        }
    });
}

function executeTdsSplitSave(gross, tds, net, pan) {
    let enteredPayee = document.getElementById('vPayee').value.trim().toUpperCase(); 
    let headMain = document.getElementById('vPurpose').value.trim();
    let headRemarks = document.getElementById('vRemarks').value.trim();
    let address = document.getElementById('vAddress').value.trim();
    let voucherText = document.getElementById('vVoucherText').value.trim();

    let dateVal = document.getElementById('vDate').value; 
    let mode = document.querySelector('input[name="payMode"]:checked').value;
    let chequeRaw = document.getElementById('vCheque').value.trim();

    let hasBill = document.getElementById('vHasBill').checked;
    let billNo = hasBill ? document.getElementById('vBillNo').value.trim() : "";

    if(!dateVal || !enteredPayee || !headMain) return Swal.fire('Error', 'કૃપા કરીને બધી જરૂરી વિગતો નાખો.', 'error');

    let remarksWithBill = headRemarks;
    if(hasBill && billNo) remarksWithBill += ` (Bill: ${billNo})`;
    let finalChequeNo = mode === 'CASH' ? "[CASH]" : (chequeRaw || "-");

    let combinedPurposeGross = [headMain, remarksWithBill, address, voucherText + `\n(Gross Bill. TDS Deducted: ₹${tds})`].join(" || ");
    let payloadGross = { 
        accountType: document.getElementById('activeAccountType').value, type: 'EXPENSE', date: dateVal, 
        voucherNo: document.getElementById('vNo').value || "AUTO", payeeName: enteredPayee, purposeHead: combinedPurposeGross, 
        chequeNo: finalChequeNo, amount: gross 
    };

    let tdsRemarks = `TDS Deducted @ ${pan} for ${enteredPayee}`;
    let combinedPurposeTDS = ["TDS / ટેક્સ કપાત", tdsRemarks, address, `TDS 194C Deducted from ${enteredPayee} bill.`].join(" || ");
    let payloadTDS = { 
        accountType: document.getElementById('activeAccountType').value, type: 'INCOME', date: dateVal, 
        voucherNo: "AUTO", payeeName: "SMC (TDS ACCOUNT)", purposeHead: combinedPurposeTDS, 
        chequeNo: "INTERNAL", amount: tds 
    };

    const btn = document.getElementById('saveBtn'); let origHtml = btn.innerHTML;
    btn.innerHTML = '<i data-feather="loader" class="animate-spin inline w-5 h-5"></i> TDS Saving...'; btn.disabled = true;

    if(!localHeads.includes(headMain)) localHeads.push(headMain); 
    if(!localHeads.includes("TDS / ટેક્સ કપાત")) localHeads.push("TDS / ટેક્સ કપાત"); 
    if(enteredPayee && !localVendors.includes(enteredPayee)) localVendors.push(enteredPayee); 
    localStorage.setItem('pmShriLocalHeads', JSON.stringify(localHeads));
    localStorage.setItem('pmShriLocalVendors', JSON.stringify(localVendors));
    renderMasters();

    google.script.run.withSuccessHandler(resResponse => {
        let res1 = typeof resResponse === 'string' ? JSON.parse(resResponse) : resResponse;
        if(res1.success) {
            google.script.run.withSuccessHandler(resResponse2 => {
                let res2 = typeof resResponse2 === 'string' ? JSON.parse(resResponse2) : resResponse2;
                if(res2.success) {
                    btn.innerHTML = origHtml; btn.disabled = false;
                    let finalVchNo = payloadGross.voucherNo === "AUTO" ? (localLedgerData.length > 0 ? (parseInt(localLedgerData[0].voucherNo) + 1) : 1) : payloadGross.voucherNo;
                    
                    Swal.fire({
                        title: 'TDS એન્ટ્રી સેવ થઈ ગઈ!', 
                        text: 'Gross ખર્ચ અને TDS ની જમા એન્ટ્રી બંને સેવ થઈ ગયા છે. શું તમારે વાઉચર પ્રિન્ટ કરવું છે?', 
                        icon: 'success',
                        showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#64748b',
                        confirmButtonText: 'પ્રિન્ટ કરો', cancelButtonText: 'પછી પ્રિન્ટ કરીશ'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            printPhysicalVoucher(finalVchNo, dateVal.split('-').reverse().join('-'), enteredPayee, headMain, headRemarks, address, voucherText, 'EXPENSE', mode, net, finalChequeNo);
                        }
                        resetVoucherForm(); 
                        localforage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                        localStorage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                        loadLedger(); 
                        switchTab('manage');
                    });
                } else { Swal.fire('Error', res2.message, 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
            }).saveLocalVoucher(payloadTDS);
        } else { Swal.fire('Error', res1.message, 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
    }).withFailureHandler(err => { 
        btn.innerHTML = origHtml; btn.disabled = false; Swal.fire('Error', err.toString(), 'error'); 
    }).saveLocalVoucher(payloadGross);
}

function submitVoucher() {
    let enteredPayee = document.getElementById('vPayee').value.trim().toUpperCase(); 
    let headMain = document.getElementById('vPurpose').value.trim();
    let headRemarks = document.getElementById('vRemarks').value.trim();
    let address = document.getElementById('vAddress').value.trim();
    let voucherText = document.getElementById('vVoucherText').value.trim();
    
    let dateVal = document.getElementById('vDate').value; 
    let amtVal = parseFloat(document.getElementById('vAmt').value) || 0;
    let mode = document.querySelector('input[name="payMode"]:checked').value;
    let chequeRaw = document.getElementById('vCheque').value.trim();
    let type = document.getElementById('entryType').value;
    
    let hasBill = type === 'EXPENSE' ? document.getElementById('vHasBill').checked : false;
    let billNo = type === 'EXPENSE' && hasBill ? document.getElementById('vBillNo').value.trim() : "";
    
    if(!dateVal || !enteredPayee || !headMain || amtVal <= 0) return Swal.fire('Error', 'કૃપા કરીને બધી જરૂરી વિગતો અને રકમ નાખો.', 'error');

    if(mode === 'CASH' && type === 'EXPENSE' && amtVal > 2000) {
        return Swal.fire('સરકારી નિયમ (Rule Violation)', 'સરકારી નિયમ મુજબ <b>₹2000</b> થી વધુ રકમનું <b>રોકડ (Cash)</b> પેમેન્ટ કરી શકાય નહિ. કૃપા કરીને બેંક નો ઉપયોગ કરો.', 'error');
    }

    if(type === 'EXPENSE' && hasBill && billNo) headRemarks += ` (Bill: ${billNo})`;
    let finalChequeNo = mode === 'CASH' ? "[CASH]" : (chequeRaw || "-");

    let combinedPurpose = [headMain, headRemarks, address, voucherText].join(" || ");

    if(!localHeads.includes(headMain)) { localHeads.push(headMain); localStorage.setItem('pmShriLocalHeads', JSON.stringify(localHeads)); }
    if(enteredPayee && !localVendors.includes(enteredPayee)) { localVendors.push(enteredPayee); localStorage.setItem('pmShriLocalVendors', JSON.stringify(localVendors)); }
    renderMasters();

    const payload = { 
        accountType: document.getElementById('activeAccountType').value, type: type, date: dateVal, 
        voucherNo: document.getElementById('vNo').value || "AUTO", payeeName: enteredPayee, purposeHead: combinedPurpose, 
        chequeNo: finalChequeNo, amount: amtVal 
    };
    
    const btn = document.getElementById('saveBtn'); let origHtml = "";
    if(btn) { origHtml = btn.innerHTML; btn.innerHTML = '<i data-feather="loader" class="animate-spin inline w-5 h-5"></i> Saving...'; btn.disabled = true; }

    google.script.run.withSuccessHandler(resResponse => {
        if(btn) { btn.innerHTML = origHtml; btn.disabled = false; }
        
        let res = typeof resResponse === 'string' ? JSON.parse(resResponse) : resResponse;

        if(res.success) {
            let finalVchNo = payload.voucherNo === "AUTO" ? (localLedgerData.length > 0 ? (parseInt(localLedgerData[0].voucherNo) + 1) : 1) : payload.voucherNo;
            
            Swal.fire({
                title: 'એન્ટ્રી સેવ થઈ ગઈ!', 
                text: 'શું તમારે આ વાઉચર પ્રિન્ટ કરવું છે?', 
                icon: 'success',
                showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#64748b',
                confirmButtonText: 'પ્રિન્ટ કરો', cancelButtonText: 'પછી પ્રિન્ટ કરીશ'
            }).then((result) => {
                if (result.isConfirmed) {
                    printPhysicalVoucher(finalVchNo, dateVal.split('-').reverse().join('-'), enteredPayee, headMain, headRemarks, address, voucherText, type, mode, amtVal, finalChequeNo);
                }
                resetVoucherForm(); 
                localforage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                localStorage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
                loadLedger(); 
                switchTab('manage');
            });
        } else { Swal.fire('Error', res.message || 'Unknown Error', 'error'); }
    }).withFailureHandler(err => { 
        if(btn) { btn.innerHTML = origHtml; btn.disabled = false; }
        Swal.fire('Error', err.toString(), 'error'); 
    }).saveLocalVoucher(payload);
}

function resetVoucherForm() {
    let tsPayee = document.getElementById('vPayee').tomselect; if(tsPayee) tsPayee.clear();
    let tsPurpose = document.getElementById('vPurpose').tomselect; if(tsPurpose) tsPurpose.clear();
    
    let els = ['vRemarks','vAddress','vVoucherText','vAmt','vCheque','vBillNo'];
    els.forEach(id => { let el = document.getElementById(id); if(el) el.value = ""; });
    let wEl = document.getElementById('vAmtWords'); if(wEl) wEl.innerText = "";
}

function printFilledVoucher(origTitle) {
    let old = document.getElementById('print-temp-container');
    if (old) old.remove();

    let source = document.getElementById('printVoucherSection');
    if (!source) { Swal.fire('Error', 'Voucher template not found', 'error'); return; }

    let printContainer = document.createElement('div');
    printContainer.id = 'print-temp-container';
    printContainer.style.cssText = 'width:100%; margin:0; padding:6mm 8mm; background:white; box-sizing:border-box; border:1.5px solid #1e293b;';

    let headerBanner = document.createElement('div');
    headerBanner.style.cssText = 'display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px; padding:6px 0 8px 0; border-bottom:2px solid #1e293b; gap:8px;';

    let leftDiv = document.createElement('div');
    leftDiv.style.cssText = 'flex:0 0 90px; display:flex; align-items:center;';
    if (typeof logoSettings !== 'undefined' && logoSettings.useSchoolLogo && logoSettings.schoolLogoUrl) {
    let imgL = document.createElement('img');
    imgL.src = logoSettings.schoolLogoUrl;
    imgL.style.cssText = 'height:48px; width:auto; max-width:85px; object-fit:contain;';
    leftDiv.appendChild(imgL);
    }
    headerBanner.appendChild(leftDiv);

    let centerDiv = document.createElement('div');
    centerDiv.style.cssText = 'flex:1; text-align:center; font-family:"Anek Gujarati",sans-serif; padding:0 8px;';

    let displayName = currentSchoolName;
    let nameSpan = document.createElement('div');
    nameSpan.style.cssText = 'font-weight:800; font-size:16px; color:#0f172a; line-height:1.2;';
    nameSpan.innerText = displayName;
    centerDiv.appendChild(nameSpan);

    let udiseSpan = document.createElement('div');
    udiseSpan.style.cssText = 'font-weight:700; font-size:11px; color:#475569; margin-top:2px; letter-spacing:0.5px;';
    udiseSpan.innerText = currentUdise ? ('UDISE: ' + currentUdise) : '';
    centerDiv.appendChild(udiseSpan);
    headerBanner.appendChild(centerDiv);

    let rightDiv = document.createElement('div');
    rightDiv.style.cssText = 'flex:0 0 130px; display:flex; gap:6px; align-items:center; justify-content:flex-end;';
    if (typeof logoSettings !== 'undefined') {
    if (logoSettings.usePmShri) {
        let imgP = document.createElement('img');
        imgP.src = logoSettings.pmShriLogoUrl || DEFAULT_PMSHRI_LOGO;
        if (imgP.src) { imgP.style.cssText = 'height:42px; width:auto; object-fit:contain;'; rightDiv.appendChild(imgP); }
    }
    if (logoSettings.useSsa) {
        let imgS = document.createElement('img');
        imgS.src = logoSettings.ssaLogoUrl || DEFAULT_SSA_LOGO;
        if (imgS.src) { imgS.style.cssText = 'height:42px; width:auto; object-fit:contain;'; rightDiv.appendChild(imgS); }
    }
    }
    headerBanner.appendChild(rightDiv);

    let clone = source.cloneNode(true);
    clone.style.display = 'block';
    clone.classList.remove('voucher-print-container');
    clone.style.cssText = 'display:block; visibility:visible; width:100%; border:none; padding:8px 4px 12px 4px; box-sizing:border-box; margin-top:0; background:white;';  
    
    printContainer.appendChild(headerBanner);
    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);

    setTimeout(function () {
    window.print();
    setTimeout(function () {
        printContainer.remove();
        if (origTitle) document.title = origTitle;
    }, 700);
    }, 500);
}

function printPhysicalVoucher(vchNo, vchDate, payee, head, remarks, address, voucherText, type, mode, amount, checkNoRaw) {
    let els = {
        'pvMainTitle': type === 'INCOME' ? "પહોંચ (Receipt)" : "પેમેન્ટ વાઉચર",
        'pvTypeLabel': type === 'INCOME' ? "પહોંચ નંબર :" : "વાઉચર નંબર :",
        'pvNo': escapeHtml(vchNo),
        'pvDate': escapeHtml(vchDate),
        'pvSchoolName2': escapeHtml(currentSchoolName),
        'pvPayee': escapeHtml(payee),
        'pvAddress': escapeHtml(address) || "-"
    };
    
    for(let id in els) { let el = document.getElementById(id); if(el) el.innerText = els[id]; }
    
    let finalVoucherText = voucherText || `બા.જે. આજ રોજ વ્યવહાર હેડ: ${head} અન્વયે થયેલ છે.`;
    if(mode !== 'CASH' && checkNoRaw && checkNoRaw !== '-' && !String(checkNoRaw).includes('[CASH]')) {
        finalVoucherText += `\n(ચેક/Ref નં: ${checkNoRaw})`;
    }
    
    let vtEl = document.getElementById('pvVoucherText'); if(vtEl) vtEl.innerText = escapeHtml(finalVoucherText);
    let remEl = document.getElementById('pvRemarksData'); if(remEl) remEl.innerText = remarks ? "( વિગત : " + escapeHtml(remarks) + " )" : "";
    
    let amtStr = parseFloat(amount).toFixed(2);
    let rupees = new Intl.NumberFormat('en-IN').format(amtStr.split('.')[0]);
    let paise = amtStr.split('.')[1] + "/-";
    
    let pvAmtRe = document.getElementById('pvAmtRupees'); if(pvAmtRe) pvAmtRe.innerText = rupees;
    let pvAmtPs = document.getElementById('pvAmtPaise'); if(pvAmtPs) pvAmtPs.innerText = paise;
    let pvTotRe = document.getElementById('pvTotalRupees'); if(pvTotRe) pvTotRe.innerText = rupees;
    let pvTotPs = document.getElementById('pvTotalPaise'); if(pvTotPs) pvTotPs.innerText = paise;
    
    let wEl = document.getElementById('pvWords'); if(wEl) wEl.innerText = getGujaratiWords(amount) + " પૂરા";
    
    let safePayee = payee.replace(/[^a-zA-Z0-9]/g, '_');
    let origTitle = document.title;
    document.title = currentSchoolName + '_' + currentUdise + '_Voucher_' + safePayee;
    printFilledVoucher(origTitle);
}

function printVoucherFromRecordId(txnId) {
    let r = localLedgerData.find(x => x.id === txnId);
    if(!r) return;
    
    let incVal = parseFloat(r.income) || 0;
    let expVal = parseFloat(r.expense) || 0;
    let type = incVal > 0 ? 'INCOME' : 'EXPENSE';
    let amount = incVal > 0 ? incVal : expVal;
    let mode = r.chequeNo && String(r.chequeNo).includes('[CASH]') ? 'CASH' : 'BANK';
    
    let parts = String(r.purposeHead || "").split(" || ");
    let headMain = parts[0] || "";
    let headRemarks = parts[1] || "";
    let address = parts[2] || "";
    let voucherText = parts[3] || "";
    
    printPhysicalVoucher(r.voucherNo, r.date, r.payeeName, headMain, headRemarks, address, voucherText, type, mode, amount, r.chequeNo);
}

function selectReport(type, el) {
    document.querySelectorAll('.report-card').forEach(card => { card.classList.remove('active', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-300'); });
    el.classList.add('active', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-300'); 
    currentReportType = type;
    
    let titles = { 'cashbook': '- : દૈનિક કેશબુક (રોકડમેળ) : -', 'ledger': 'આવક ખર્ચનું વર્ગીકરણ (ખાતાવહી) - પરિશિષ્ટ નંબર : ૨', 'party': 'પાર્ટી / વેન્ડર વાઈઝ લેજર (Party Statement)', 'epayment': 'Bank Book', 'voucherlist': 'વાઉચર રજીસ્ટર', 'bill': 'વર્ષ દરમિયાનનું બિલોનું નોંધપત્રક (બિલ રજીસ્ટર)', 'cheque': 'ચેક રજીસ્ટર', 'grant': 'ગ્રાન્ટ રજીસ્ટર : પરિશિષ્ટ ૧૧', 'p10': 'પરિશિષ્ટ -૧૦ (ગ્રાન્ટ વપરાશ પ્રમાણપત્ર)', 'p9': 'પરિશિષ્ટ –9 (લિમિટ મેળવણું)' };
    let rtv = document.getElementById('reportTitleViewer'); if(rtv) rtv.innerText = titles[type];
    let fhc = document.getElementById('filterHeadContainer'); if(fhc) fhc.classList.toggle('hidden', !(type === 'ledger' || type === 'party'));
    let fvc = document.getElementById('filterVendorContainer'); if(fvc) fvc.classList.toggle('hidden', type !== 'party');
    let csc = document.getElementById('cashbookStyleContainer'); if(csc) csc.classList.toggle('hidden', type !== 'cashbook');
    
    generateAccountingReport();
}

function setCashbookStyle(style) {
    cashbookStyle = style;
    if(style === 'TWO') { document.body.classList.add('folio-mode-two'); } else { document.body.classList.remove('folio-mode-two'); }
    let bOne = document.getElementById('btnCbOnePage'); let bTwo = document.getElementById('btnCbTwoPage');
    if(bOne && bTwo) {
        if(style === 'ONE') { bOne.className = "flex-1 px-2 py-2 rounded-lg text-xs font-bold bg-white text-emerald-700 shadow-sm transition"; bTwo.className = "flex-1 px-2 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-white/50 transition"; } 
        else { bTwo.className = "flex-1 px-2 py-2 rounded-lg text-xs font-bold bg-white text-emerald-700 shadow-sm transition"; bOne.className = "flex-1 px-2 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-white/50 transition"; }
    }
    generateAccountingReport();
}

function executeSmartPrint(targetId, layout, margin, scale, bwMode, origTitle) {
    let target = document.getElementById(targetId);
    if (!target) return Swal.fire('Error', 'પ્રિન્ટ કરવા માટે ડેટા મળ્યો નથી!', 'error');

    let children = Array.from(document.body.children);
    let hiddenChildren = [];
    children.forEach(child => {
        if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.style.display !== 'none') {
            hiddenChildren.push({ el: child, display: child.style.display });
            child.style.display = 'none';
        }
    });

    let printContainer = document.createElement('div');
    printContainer.id = 'print-temp-container';
    document.body.appendChild(printContainer);
    
    let parent = target.parentNode;
    let sibling = target.nextSibling;
    printContainer.appendChild(target);

    let dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'dynamic-print-setup';
    dynamicStyle.innerHTML = `
        @media print {
            @page { size: ${layout}; margin: ${margin}; }
            body { zoom: ${scale} !important; margin: 0 !important; padding: 0 !important; }
            .report-page-safe, .folio-col, .ledger-page {
                display: block !important;
                page-break-after: always !important;
                clear: both !important;
                position: relative !important;
            }
        }
    `;
    document.head.appendChild(dynamicStyle);

    if (bwMode) document.body.classList.add('print-bw');

    let addedLogos = [];
    if (typeof logoSettings !== 'undefined' && (logoSettings.useSchoolLogo || logoSettings.usePmShri || logoSettings.useSsa)) {
        target.querySelectorAll('.print-no-bg').forEach(header => {
            header.style.position = 'relative'; 
            
            if (logoSettings.useSchoolLogo && logoSettings.schoolLogoUrl) {
                let imgL = document.createElement('img');
                imgL.src = logoSettings.schoolLogoUrl;
                imgL.className = 'temp-print-logo';
                imgL.style.cssText = 'position:absolute; left:10px; top:5px; height:45px; width:auto; object-fit:contain; z-index:100;';
                header.appendChild(imgL);
                addedLogos.push(imgL);
            }
            
            if (logoSettings.usePmShri || logoSettings.useSsa) {
                let schemeUrl = logoSettings.usePmShri ? (logoSettings.pmShriLogoUrl || DEFAULT_PMSHRI_LOGO) : (logoSettings.ssaLogoUrl || DEFAULT_SSA_LOGO);
                let imgR = document.createElement('img');
                imgR.src = schemeUrl;
                imgR.className = 'temp-print-logo';
                imgR.style.cssText = 'position:absolute; right:10px; top:5px; height:45px; width:auto; object-fit:contain; z-index:100;';
                header.appendChild(imgR);
                addedLogos.push(imgR);
            }
        });
    }

    setTimeout(() => {
        window.print();
        
        document.body.classList.remove('print-bw');
        dynamicStyle.remove();
        addedLogos.forEach(img => img.remove());
        
        if (sibling) parent.insertBefore(target, sibling);
        else parent.appendChild(target);
        
        printContainer.remove();
        hiddenChildren.forEach(item => { item.el.style.display = item.display; });
        document.title = origTitle;
    }, 500);
}

window.printReport = function() {
    let reportNames = { 'cashbook': 'Cashbook', 'ledger': 'Khatavahi', 'epayment': 'Local_EPayment', 'voucherlist': 'Voucher_List', 'bill': 'Bill_Register', 'cheque': 'Cheque_Register', 'grant': 'Grant_Register', 'p10': 'Parishisht_10', 'p9': 'Parishisht_9' };
    let rName = reportNames[currentReportType] || 'Report';
    let origTitle = document.title;
    document.title = `${currentSchoolName}_${currentUdise}_${rName}`;

    let defaultLayout = ['cashbook', 'epayment', 'bill', 'cheque', 'grant', 'voucherlist'].includes(currentReportType) ? 'landscape' : 'portrait';
    showPrintSetupMenu('tableWrapper', defaultLayout, origTitle);
}

function showPrintSetupMenu(targetId, defaultLayout, origTitle) {
    let layoutPortraitHtml = defaultLayout === 'portrait' ? 'selected' : '';
    let layoutLandscapeHtml = defaultLayout === 'landscape' ? 'selected' : '';

    Swal.fire({
        title: '<span class="text-xl text-indigo-700">🖨️ Smart Print Setup</span>',
        html: `
            <div class="text-left text-sm text-slate-700">
                <label class="block mb-1 font-bold">1. Page Layout (પેજ લેઆઉટ)</label>
                <select id="pr-layout" class="w-full border border-slate-300 p-2 mb-3 rounded focus:ring-2 focus:ring-indigo-500">
                    <option value="portrait" ${layoutPortraitHtml}>📄 ઊભું (Portrait)</option>
                    <option value="landscape" ${layoutLandscapeHtml}>📟 આડું (Landscape)</option>
                </select>
                
                <label class="block mb-1 font-bold">2. Margins (માર્જિન)</label>
                <select id="pr-margin" class="w-full border border-slate-300 p-2 mb-3 rounded focus:ring-2 focus:ring-indigo-500">
                    <option value="15mm">ઓફિશિયલ (15mm) - Recommended</option>
                    <option value="10mm">સામાન્ય (10mm)</option>
                    <option value="5mm">ઓછું (5mm) - For large tables</option>
                </select>

                <label class="block mb-1 font-bold">3. Scale / Zoom (ટેબલ ફિટ કરવા)</label>
                <select id="pr-scale" class="w-full border border-slate-300 p-2 mb-3 rounded focus:ring-2 focus:ring-indigo-500">
                    <option value="1">100% (Default)</option>
                    <option value="0.9">90% (જો ટેબલ કપાતું હોય તો)</option>
                    <option value="0.8">80% (બહુ મોટો રિપોર્ટ ફિટ કરવા)</option>
                    <option value="0.7">70%</option>
                </select>

                <label class="block mb-1 font-bold">4. Color Mode (પ્રિન્ટરની શાહી)</label>
                <select id="pr-color" class="w-full border border-slate-300 p-2 mb-3 rounded focus:ring-2 focus:ring-indigo-500">
                    <option value="color">🎨 કલર પ્રિન્ટ (Color)</option>
                    <option value="bw">⚫ બ્લેક & વ્હાઈટ (B/W Ink Saver)</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '🖨️ Print Now',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        preConfirm: () => {
            return {
                layout: document.getElementById('pr-layout').value,
                margin: document.getElementById('pr-margin').value,
                scale: document.getElementById('pr-scale').value,
                bwMode: document.getElementById('pr-color').value === 'bw'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let v = result.value;
            executeSmartPrint(targetId, v.layout, v.margin, v.scale, v.bwMode, origTitle);
        }
    });
}

window.prepareProfessionalPrint = function(bwMode = false) {
  const target = document.getElementById('tableWrapper');
  if (!target || !target.innerHTML.trim()) {
      return Swal.fire({ icon: 'error', title: 'પ્રિન્ટ એરર', text: 'પ્રિન્ટ કરવા માટે રિપોર્ટ મળ્યો નથી! પહેલા રિપોર્ટ જનરેટ કરો.', confirmButtonText: 'ઠીક છે' });
  }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-temp-container';
  printContainer.style.cssText = 'width:100%; margin:0; padding:0; background:white;';
  document.body.appendChild(printContainer);

  const clone = target.cloneNode(true);
  clone.querySelectorAll('.no-print, button').forEach(el => el.remove());

  clone.style.display = 'block';
  clone.style.width = '100%';
  printContainer.appendChild(clone);

  if (bwMode) { document.body.classList.add('print-bw'); }

  if (typeof logoSettings !== 'undefined') {
      let pages = clone.querySelectorAll('.page-chunk, .folio-col, .ledger-page, .report-page-safe');
      if (pages.length === 0) pages = clone.querySelectorAll('table'); 

      pages.forEach((page) => {
          page.style.position = 'relative'; 
          page.style.boxSizing = 'border-box';

          let headerBanner = document.createElement('div');
          headerBanner.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:6px;padding:4px 0 6px 0;border-bottom:1.5px solid #334155;gap:8px;';

          let leftDiv = document.createElement('div');
          leftDiv.style.cssText = 'flex:0 0 90px;display:flex;align-items:center;';
          if (logoSettings.useSchoolLogo && logoSettings.schoolLogoUrl) {
              let imgL = document.createElement('img');
              imgL.src = logoSettings.schoolLogoUrl;
              imgL.style.cssText = 'height:42px;width:auto;max-width:85px;object-fit:contain;';
              leftDiv.appendChild(imgL);
          }
          headerBanner.appendChild(leftDiv);

          let centerDiv = document.createElement('div');
          centerDiv.style.cssText = 'flex:1;text-align:center;font-family:"Anek Gujarati",sans-serif;padding:0 8px;overflow:hidden;';
          
          let nameSpan = document.createElement('div');
          nameSpan.style.cssText = 'font-weight:800;font-size:15px;color:#0f172a;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          nameSpan.innerText = currentSchoolName;
          centerDiv.appendChild(nameSpan);

          let udiseSpan = document.createElement('div');
          udiseSpan.style.cssText = 'font-weight:700;font-size:11px;color:#475569;margin-top:1px;letter-spacing:0.5px;';
          udiseSpan.innerText = currentUdise ? ('UDISE: ' + currentUdise) : '';
          centerDiv.appendChild(udiseSpan);
          headerBanner.appendChild(centerDiv);

          let rightDiv = document.createElement('div');
          rightDiv.style.cssText = 'flex:0 0 120px;display:flex;gap:6px;align-items:center;justify-content:flex-end;';
          if (logoSettings.usePmShri) {
              let imgP = document.createElement('img');
              imgP.src = logoSettings.pmShriLogoUrl || DEFAULT_PMSHRI_LOGO;
              imgP.style.cssText = 'height:40px;width:auto;object-fit:contain;';
              rightDiv.appendChild(imgP);
          }
          if (logoSettings.useSsa) {
              let imgS = document.createElement('img');
              imgS.src = logoSettings.ssaLogoUrl || DEFAULT_SSA_LOGO;
              imgS.style.cssText = 'height:40px;width:auto;object-fit:contain;';
              rightDiv.appendChild(imgS);
          }
          headerBanner.appendChild(rightDiv);
          page.insertBefore(headerBanner, page.firstChild);

          let oldWm = page.querySelector('.custom-watermark');
          if (oldWm) oldWm.remove();

          let watermarkUrl = (logoSettings.useSchoolLogo && logoSettings.schoolLogoUrl) ? logoSettings.schoolLogoUrl : (logoSettings.usePmShri ? (logoSettings.pmShriLogoUrl || DEFAULT_PMSHRI_LOGO) : (logoSettings.useSsa ? (logoSettings.ssaLogoUrl || DEFAULT_SSA_LOGO) : ''));
          
          if (watermarkUrl) {
              let wm = document.createElement('div');
              wm.className = 'custom-watermark';
              wm.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background-image: url('${watermarkUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; opacity: 0.04; z-index: 0; pointer-events: none;`;
              page.insertBefore(wm, headerBanner.nextSibling);
          }
      });
  }

  setTimeout(() => {
      window.print();
      setTimeout(() => { document.body.classList.remove('print-bw'); printContainer.remove(); }, 700);
  }, 1500); 
};

function renderLedgerUI(res) {
    const tbody = document.getElementById('ledgerBody');
    if(!tbody) return;
    
    try {
        tbody.innerHTML = ""; localLedgerData = [];
        let latestBal = 0; let tIncome = 0; let tExpense = 0;
        let cashInc = 0; let cashExp = 0;
        
        if(res.success && Array.isArray(res.data) && res.data.length > 0) {
            localLedgerData = res.data; 
            res.data.forEach((r, index) => {
                let inc = parseFloat(r.income); if(isNaN(inc)) inc = 0;
                let exp = parseFloat(r.expense); if(isNaN(exp)) exp = 0;
                let bal = parseFloat(r.balance); if(isNaN(bal)) bal = 0;

                if(index === 0) latestBal = bal; 
                
                let isCash = r.chequeNo && String(r.chequeNo).includes("[CASH]");
                if(r.id !== "OPENING-BAL") { 
                    tIncome += inc; tExpense += exp; 
                    if(isCash) { cashInc += inc; cashExp += exp; }
                }
                
                let incHtml = inc > 0 ? `₹${formatINR(inc)}` : "-"; let expHtml = exp > 0 ? `₹${formatINR(exp)}` : "-";
                let rowClass = r.id === "OPENING-BAL" ? "bg-blue-50/50" : "hover:bg-slate-50";
                
                let rawHead = String(r.purposeHead || ""); 
                let parts = rawHead.split(" || "); 
                let headPart = escapeHtml(parts[0] || "-"); 
                let remarkPart = escapeHtml(parts[1] || "-");
                
                let safeDate = escapeHtml(r.date);
                let safeVch = escapeHtml(r.voucherNo) + (r.accSource ? `<br><span class="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1 inline-block">${r.accSource}</span>` : "");
                let safePayee = escapeHtml(r.payeeName);

                tbody.innerHTML += `<tr class="border-b border-slate-100 ${rowClass}">
                    <td class="p-3 align-top"><div class="font-bold text-slate-700 whitespace-nowrap">${safeDate}</div><div class="text-[9px] text-slate-400 font-mono">VCH: ${safeVch}</div></td>
                    <td class="p-3"><div class="font-bold text-indigo-700 max-w-[250px] truncate">${safePayee}</div><div class="text-[11px] text-slate-600 font-bold truncate max-w-[250px]">${headPart}</div><div class="text-[10px] text-slate-500 font-semibold truncate max-w-[250px]">${remarkPart}</div></td>
                    <td class="p-3 text-right font-black text-emerald-600 align-top whitespace-nowrap">${incHtml}</td>
                    <td class="p-3 text-right font-black text-rose-600 align-top whitespace-nowrap">${expHtml}</td>
                    <td class="p-3 text-right font-bold text-slate-800 align-top whitespace-nowrap">₹${formatINR(bal)}</td>
                </tr>`;
            });
            renderManageTable();
        } else { 
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-slate-400 font-bold text-sm">કોઈ એન્ટ્રી જોવા મળી નથી.</td></tr>`; 
            let mtb = document.getElementById('manageTableBody'); if(mtb) mtb.innerHTML = `<tr><td colspan="6" class="text-center py-10 font-bold text-slate-400">કોઈ ડેટા ઉપલબ્ધ નથી.</td></tr>`;
        }
        
        let dbEl = document.getElementById('dashBalance'); if(dbEl) dbEl.innerText = "₹ " + formatINR(latestBal);
        let vabEl = document.getElementById('vAvailableBal'); if(vabEl) vabEl.innerText = "₹ " + formatINR(latestBal);
        let diEl = document.getElementById('dashIncome'); if(diEl) diEl.innerText = "₹ " + formatINR(tIncome);
        let deEl = document.getElementById('dashExpense'); if(deEl) deEl.innerText = "₹ " + formatINR(tExpense);
        
        currentCashBalance = cashInc - cashExp;
        let cashBadge = document.getElementById('dashCashBadge');
        if(cashBadge) {
            if(currentCashBalance > 0) {
                cashBadge.className = "mt-3 inline-block bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold border border-white/30 backdrop-blur-sm";
                cashBadge.innerHTML = `Cash: ₹ ${formatINR(currentCashBalance)} <span class="block text-[9px] mt-1 opacity-80">(નોંધ: રોકડ ૭ દિવસથી વધુ રાખી શકાય નહિ.)</span>`;
            } else {
                cashBadge.className = "mt-3 inline-block bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold border border-white/30 backdrop-blur-sm";
                cashBadge.innerHTML = `Cash: ₹ 0.00`;
            }
        }

        let taEl = document.getElementById('tab-accounting');
        if(taEl && taEl.classList.contains('active')) generateAccountingReport();

        if (typeof renderLocalCharts === 'function') renderLocalCharts(localLedgerData);

    } catch(uiError) {
        console.error(uiError);
        Swal.fire("Data Rendering Error", "ડેટા સ્ક્રીન પર બતાવવામાં ભૂલ આવી રહી છે.", "error");
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-rose-500 font-bold">Error Rendering Data.</td></tr>`;
    }
}

async function loadLedger() {
    const accType = document.getElementById('activeAccountType').value;
    const tbody = document.getElementById('ledgerBody');
    if(!tbody) return;

    if (accType === "ALL_ACCOUNTS") {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-slate-400 font-bold text-sm"><i data-feather="loader" class="animate-spin inline w-4 h-4 mb-1 text-slate-400"></i> Aggregating Master View...</td></tr>`; 
        try { feather.replace(); } catch(e){}

        let allData = [];
        for (let i = 0; i < localAccountTypes.length; i++) {
            let aType = localAccountTypes[i].val;
            let cKey = `pmShriLedger_${currentUdise}_${aType}`;
            let cStr = await localforage.getItem(cKey);
            if (!cStr) cStr = localStorage.getItem(cKey);
            if (cStr) {
                let cData = typeof cStr === 'string' ? JSON.parse(cStr) : cStr;
                if (cData && cData.data && Array.isArray(cData.data)) {
                    let records = cData.data.filter(r => r.id !== "OPENING-BAL").map(r => ({...r, accSource: aType}));
                    allData = allData.concat(records);
                }
            }
        }

        allData.sort((a, b) => { 
            let [d1, m1, y1]=String(a.date||"").split('-'); let [d2, m2, y2]=String(b.date||"").split('-'); 
            return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`); 
        });

        let runBal = 0;
        let masterData = [{id: "OPENING-BAL", date: "-", voucherNo: "-", payeeName: "MASTER ALL ACCOUNTS", purposeHead: "-", income: 0, expense: 0, balance: 0}];
        allData.forEach(r => {
            let inc = parseFloat(r.income) || 0; let exp = parseFloat(r.expense) || 0;
            runBal += (inc - exp); r.balance = runBal; masterData.push(r);
        });
        renderLedgerUI({success: true, data: masterData.reverse()});
        return; 
    }

    const cacheKey = `pmShriLedger_${currentUdise}_${accType}`;
    
    let cachedStr = await localforage.getItem(cacheKey);
    if (!cachedStr) {
        cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            await localforage.setItem(cacheKey, cachedStr);
            localStorage.removeItem(cacheKey); 
        }
    }

    if (cachedStr) {
        try {
            let cachedData = typeof cachedStr === 'string' ? JSON.parse(cachedStr) : cachedStr;
            renderLedgerUI(cachedData); 
        } catch(e) {}
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-slate-400 font-bold text-sm"><i data-feather="loader" class="animate-spin inline w-4 h-4 mb-1 text-slate-400"></i> Loading Secure Data...</td></tr>`; 
        try { feather.replace(); } catch(e){}
    }

    google.script.run.withSuccessHandler(async (resResponse) => {
        let res;
        if (typeof resResponse === 'string') {
            try { res = JSON.parse(resResponse); } catch(e) { res = {success: false, data: []}; }
        } else if (typeof resResponse === 'object') { res = resResponse; } 
        else { res = {success: false, data: []}; }

        if (Array.isArray(res)) res = { success: true, data: res };
        if (!res) res = { success: false, data: [] };

        await localforage.setItem(cacheKey, JSON.stringify(res));
        renderLedgerUI(res);

    }).withFailureHandler(err => {
        if(!cachedStr) {
            Swal.fire("Server Error", "ગૂગલ સર્વર સાથે જોડાણ તૂટી ગયું છે. (" + err.message + ")", "error");
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-rose-500 font-bold">Failed to load data from server.</td></tr>`;
        }
    }).getLocalLedgerData(accType); 
}

function generateAccountingReport() {
    const wrapper = document.getElementById('tableWrapper');
    if(!wrapper) return;
    
    let accTypeEl = document.getElementById('activeAccountType');
    const accType = accTypeEl ? accTypeEl.value : "";
    let bankObj = localBanks[accType] || { name: "", branch: "", accNo: "", ifsc: "" };
    let bankDisplayStr = bankObj.name ? `${escapeHtml(bankObj.name)} | A/c No: ${escapeHtml(bankObj.accNo)}` : `Local Account: ${accType}`;

    wrapper.innerHTML = `<div class="text-center py-16"><i data-feather="loader" class="animate-spin inline w-8 h-8 mb-2 text-indigo-500"></i><br><span class="font-bold text-slate-500">Generating Report...</span></div>`; 
    try { feather.replace(); } catch(e){}
    
    let displayData = [...localLedgerData].reverse(); 
    let adh = document.getElementById('accBudgetHead');
    const selectedHead = adh ? adh.value : "ALL";
    let adv = document.getElementById('accVendorSelect');
    const selectedVendor = adv ? adv.value : "ALL";
    let selectedMonths = []; 
    document.querySelectorAll('.month-chk:checked').forEach(chk => selectedMonths.push(chk.value));
    
    let _today = new Date(); 
    let _cYear = _today.getFullYear(); 
    let _cMonth = _today.getMonth() + 1;
    let _sYear = _cMonth < 4 ? _cYear - 1 : _cYear; 
    let _eYear = _sYear + 1;

    const fyYear = `${_sYear}-${String(_eYear).slice(-2)}`;
    const closingBalDate = `31-03-${_eYear}`;

    let reportDynamicClosingDate = closingBalDate;
    const fyOrder = ["apr","may","jun","jul","aug","sep","oct","nov","dec","jan","feb","mar"];
    
    let currentMonthStr = _today.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    let currentMonthIdx = fyOrder.indexOf(currentMonthStr);
    if (currentMonthIdx === -1) currentMonthIdx = 11;

    let maxIndex = 11; 
    
    if (selectedMonths.length > 0 && selectedMonths.length < 12) {
        maxIndex = -1;
        selectedMonths.forEach(m => {
            let idx = fyOrder.indexOf(String(m).toLowerCase().trim());
            if (idx > maxIndex) maxIndex = idx;
        });
    }

    let effectiveIndex = Math.min(maxIndex, currentMonthIdx);

    if (effectiveIndex !== -1) {
        let isNextYear = effectiveIndex >= 9;
        let targetYear = isNextYear ? _eYear : _sYear;
        const jsMonthMap = {"apr":3,"may":4,"jun":5,"jul":6,"aug":7,"sep":8,"oct":9,"nov":10,"dec":11,"jan":0,"feb":1,"mar":2};
        let jsMonth = jsMonthMap[fyOrder[effectiveIndex]];
        
        let lastDay = new Date(targetYear, jsMonth + 1, 0); 
        let dd = String(lastDay.getDate()).padStart(2, '0');
        let mm = String(lastDay.getMonth() + 1).padStart(2, '0');
        reportDynamicClosingDate = `${dd}-${mm}-${targetYear}`;
    }

    if ((currentReportType === 'ledger' || currentReportType === 'party') && selectedHead !== 'ALL') {
        displayData = displayData.filter(r => {
            let rawHead = String(r.purposeHead || ""); let headPart = rawHead; if(rawHead.includes(" || ")) headPart = rawHead.split(" || ")[0];
            return headPart === selectedHead || r.id === "OPENING-BAL";
        });
    }

    if (currentReportType === 'party' && selectedVendor !== 'ALL') {
        displayData = displayData.filter(r => r.payeeName === selectedVendor || r.id === "OPENING-BAL");
    }
    
    if (selectedMonths.length > 0 && selectedMonths.length < 12) {
        displayData = displayData.filter(r => {
            if(r.id === "OPENING-BAL") return true;
            let mk = "ALL";
            if(typeof getMonthKey === 'function') mk = getMonthKey(r.date);
            return selectedMonths.includes(mk);
        });
    }

    setTimeout(() => {
        try {
            if(!displayData || displayData.length === 0 || (displayData.length === 1 && displayData[0] && displayData[0].id === "OPENING-BAL")) { 
                wrapper.innerHTML = `<div class="text-center py-10 font-bold text-slate-400">કોઈ ડેટા મળ્યો નથી. (No Data Found)</div>`; 
                return; 
            }

            let uniqueDates = [...new Set(displayData.filter(r => r.id !== "OPENING-BAL").map(item => item.date))];
            uniqueDates.sort((a, b) => { let [d1, m1, y1]=String(a||"").split('-'); let [d2, m2, y2]=String(b||"").split('-'); return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`); });
            
            let cashbookPageMap = {}; uniqueDates.forEach((d, i) => cashbookPageMap[d] = i + 1);
            let allHeads = [...new Set(displayData.map(r => { let h = String(r.purposeHead || "-"); if(h.includes(" || ")) return h.split(" || ")[0]; return h; }))].sort();
            let khatavahiPageMap = {}; allHeads.forEach((h, i) => khatavahiPageMap[h] = i + 1);

            let html = `
            <div class="flex flex-wrap justify-center gap-3 mb-6 no-print">
                <button onclick="prepareProfessionalPrint(false)" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all">
                    <i data-feather="printer" class="w-4 h-4"></i> Print (Color)
                </button>
                <button onclick="prepareProfessionalPrint(true)" class="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all">
                    <i data-feather="printer" class="w-4 h-4"></i> Print (B/W - Ink Saver)
                </button>
            </div>
            <div class="print-text-sm">`; 
            
            // 1. CASHBOOK
            if (currentReportType === 'cashbook') {
                if (typeof cashbookStyle !== 'undefined' && cashbookStyle === 'TWO') {
                    html += `<div class="page-chunk folio-col">`;
                    html += `<div class="cb-page-frame bg-white border-2 border-slate-800 rounded-xl overflow-hidden">`;
                    html += `<div class="bg-emerald-800 text-white p-2 text-center font-black text-sm">રોકડમેળ : જમા બાજુ (RECEIPT / CREDIT) - ડાબું પાનું</div>`;
                    html += `<div class="bg-slate-100 text-slate-800 p-1.5 text-center font-bold text-xs border-b border-slate-800 flex justify-between px-3">
                        <span>${escapeHtml(currentSchoolName)} (${accType})</span>
                        <span>વર્ષ: ${fyYear}</span>
                        <span>${bankDisplayStr || ''}</span>
                    </div>`;
                    html += `<table class="tally-table w-full">`;
                    html += `<thead><tr class="bg-emerald-50 text-emerald-900 border-b-2 border-slate-800">
                        <th class="w-20">તારીખ</th><th class="w-28">હેડ (સદર)</th><th>આવક / જમા વિગત</th><th class="w-12">ખા.પેજ</th>
                        <th class="w-24 text-right">રોકડ (₹)</th><th class="w-24 text-right">બેંક (₹)</th><th class="w-24 text-right">કુલ (₹)</th>
                    </tr></thead><tbody>`;

                    let monthTotalIncCash = 0, monthTotalIncBank = 0, monthTotalIncGrand = 0;

                    uniqueDates.forEach((dateStr) => {
                        let dayTxns = displayData.filter(r => r.date === dateStr);
                        let incData = dayTxns.filter(r => parseFloat(r.income) > 0);
                        let dayTotalIncomeCash = incData.reduce((sum, r) => sum + (r.chequeNo && String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeBank = incData.reduce((sum, r) => sum + (!r.chequeNo || !String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeGrand = dayTotalIncomeCash + dayTotalIncomeBank;
                        monthTotalIncCash += dayTotalIncomeCash;
                        monthTotalIncBank += dayTotalIncomeBank;
                        monthTotalIncGrand += dayTotalIncomeGrand;

                        if (incData.length > 0) {
                            incData.forEach(inc => {
                                let iIsCash = inc.chequeNo && String(inc.chequeNo).includes("[CASH]");
                                let iCashVal = iIsCash ? formatINR(inc.income) : "-";
                                let iBankVal = !iIsCash ? formatINR(inc.income) : "-";
                                let rawHead = String(inc.purposeHead || "");
                                let parts = rawHead.split(" || ");
                                let iHead = escapeHtml(parts[0] || "-");
                                let iRemarks = escapeHtml(parts[1] || "-");
                                let iDesc = `<div class="font-bold text-slate-900 text-xs">${escapeHtml(inc.payeeName)}</div><div class="text-[10px] text-slate-600">${iRemarks !== "-" ? iRemarks : 'આવક જમા'}</div>`;
                                html += `<tr class="border-b border-slate-200 hover:bg-slate-50">
                                    <td class="font-bold text-center text-xs">${escapeHtml(inc.date)}</td>
                                    <td class="font-bold text-indigo-800 text-xs">${iHead}</td>
                                    <td>${iDesc}</td>
                                    <td class="text-center font-bold text-indigo-600 text-xs">${escapeHtml(khatavahiPageMap[parts[0]]) || "-"}</td>
                                    <td class="text-right font-black text-amber-800 text-xs">${iCashVal}</td>
                                    <td class="text-right font-black text-indigo-800 text-xs">${iBankVal}</td>
                                    <td class="text-right font-black text-emerald-800 text-xs">${formatINR(inc.income)}</td>
                                </tr>`;
                            });
                            html += `<tr class="bg-emerald-50/50 font-bold border-b border-slate-300">
                                <td colspan="4" class="text-right text-[11px] text-slate-700 py-1">તા. ${escapeHtml(dateStr)} કુલ જમા :</td>
                                <td class="text-right font-black text-amber-900 text-xs">${formatINR(dayTotalIncomeCash)}</td>
                                <td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalIncomeBank)}</td>
                                <td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalIncomeGrand)}</td>
                            </tr>`;
                        }
                    });

                    html += `</tbody><tfoot class="bg-slate-100 font-black border-t-2 border-slate-800">
                        <tr>
                            <td colspan="4" class="text-right font-bold text-slate-700 py-1.5 text-xs">કુલ જમા સરવાળો :</td>
                            <td class="text-right font-black text-amber-800 text-xs">${formatINR(monthTotalIncCash)}</td>
                            <td class="text-right font-black text-indigo-800 text-xs">${formatINR(monthTotalIncBank)}</td>
                            <td class="text-right font-black text-emerald-800 text-xs">${formatINR(monthTotalIncGrand)}</td>
                        </tr>
                    </tfoot></table></div></div>`;

                    html += `<div class="page-chunk folio-col">`;
                    html += `<div class="cb-page-frame bg-white border-2 border-slate-800 rounded-xl overflow-hidden">`;
                    html += `<div class="bg-rose-800 text-white p-2 text-center font-black text-sm">રોકડમેળ : ઉધાર બાજુ (PAYMENT / DEBIT) - જમણું પાનું</div>`;
                    html += `<div class="bg-slate-100 text-slate-800 p-1.5 text-center font-bold text-xs border-b border-slate-800 flex justify-between px-3">
                        <span>${escapeHtml(currentSchoolName)} (${accType})</span>
                        <span>વર્ષ: ${fyYear}</span>
                        <span>${bankDisplayStr || ''}</span>
                    </div>`;
                    html += `<table class="tally-table w-full">`;
                    html += `<thead><tr class="bg-rose-50 text-rose-900 border-b-2 border-slate-800">
                        <th class="w-20">તારીખ</th><th class="w-24">હેડ (સદર)</th><th>ખર્ચ / ઉધાર વિગત</th>
                        <th class="w-12">વા.નં.</th><th class="w-16">ચેક/Ref</th><th class="w-10">ખા.પેજ</th>
                        <th class="w-20 text-right">રોકડ (₹)</th><th class="w-20 text-right">બેંક (₹)</th><th class="w-24 text-right">કુલ (₹)</th>
                    </tr></thead><tbody>`;

                    let monthTotalExpCash = 0, monthTotalExpBank = 0, monthTotalExpGrand = 0;

                    uniqueDates.forEach((dateStr) => {
                        let dayTxns = displayData.filter(r => r.date === dateStr);
                        let expData = dayTxns.filter(r => parseFloat(r.expense) > 0);
                        let dayTotalExpCash = expData.reduce((sum, r) => sum + (r.chequeNo && String(r.chequeNo).includes("[CASH]") ? parseFloat(r.expense) : 0), 0);
                        let dayTotalExpBank = expData.reduce((sum, r) => sum + (!r.chequeNo || !String(r.chequeNo).includes("[CASH]") ? parseFloat(r.expense) : 0), 0);
                        let dayTotalExpGrand = dayTotalExpCash + dayTotalExpBank;
                        monthTotalExpCash += dayTotalExpCash;
                        monthTotalExpBank += dayTotalExpBank;
                        monthTotalExpGrand += dayTotalExpGrand;

                        let dayTotalIncomeCash = dayTxns.filter(r => parseFloat(r.income) > 0).reduce((sum, r) => sum + (r.chequeNo && String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeBank = dayTxns.filter(r => parseFloat(r.income) > 0).reduce((sum, r) => sum + (!r.chequeNo || !String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeGrand = dayTotalIncomeCash + dayTotalIncomeBank;

                        if (expData.length > 0) {
                            expData.forEach(exp => {
                                let eIsCash = exp.chequeNo && String(exp.chequeNo).includes("[CASH]");
                                let eCashVal = eIsCash ? formatINR(exp.expense) : "-";
                                let eBankVal = !eIsCash ? formatINR(exp.expense) : "-";
                                let rawHead = String(exp.purposeHead || "");
                                let parts = rawHead.split(" || ");
                                let eHead = escapeHtml(parts[0] || "-");
                                let eRemarks = escapeHtml(parts[1] || "-");
                                let eDesc = `<div class="font-bold text-slate-900 text-xs">${escapeHtml(exp.payeeName)}</div><div class="text-[10px] text-slate-600">${eRemarks !== "-" ? eRemarks : ''}</div>`;
                                let eChq = eIsCash ? "CASH" : (exp.chequeNo && exp.chequeNo !== "-" ? escapeHtml(exp.chequeNo) : "-");
                                html += `<tr class="border-b border-slate-200 hover:bg-slate-50">
                                    <td class="font-bold text-center text-xs">${escapeHtml(exp.date)}</td>
                                    <td class="font-bold text-indigo-800 text-xs">${eHead}</td>
                                    <td>${eDesc}</td>
                                    <td class="text-center font-bold text-slate-600 text-xs">${escapeHtml(exp.voucherNo)}</td>
                                    <td class="font-mono text-[10px]">${eChq}</td>
                                    <td class="text-center font-bold text-indigo-600 text-xs">${escapeHtml(khatavahiPageMap[parts[0]]) || "-"}</td>
                                    <td class="text-right font-black text-amber-800 text-xs">${eCashVal}</td>
                                    <td class="text-right font-black text-indigo-800 text-xs">${eBankVal}</td>
                                    <td class="text-right font-black text-rose-800 text-xs">${formatINR(exp.expense)}</td>
                                </tr>`;
                            });
                            html += `<tr class="bg-rose-50/50 font-bold border-b border-slate-300">
                                <td colspan="6" class="text-right text-[11px] text-slate-700 py-1">તા. ${escapeHtml(dateStr)} કુલ ઉધાર :</td>
                                <td class="text-right font-black text-amber-900 text-xs">${formatINR(dayTotalExpCash)}</td>
                                <td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalExpBank)}</td>
                                <td class="text-right font-black text-rose-900 text-xs">${formatINR(dayTotalExpGrand)}</td>
                            </tr>`;
                            html += `<tr class="bg-emerald-50/70 font-bold border-b-2 border-slate-400">
                                <td colspan="6" class="text-right text-[11px] text-emerald-900 py-1">તા. ${escapeHtml(dateStr)} શ્રી બંધ સિલક :</td>
                                <td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalIncomeCash - dayTotalExpCash)}</td>
                                <td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalIncomeBank - dayTotalExpBank)}</td>
                                <td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalIncomeGrand - dayTotalExpGrand)}</td>
                            </tr>`;
                        }
                    });

                    html += `</tbody><tfoot class="bg-slate-100 font-black border-t-2 border-slate-800">
                        <tr>
                            <td colspan="6" class="text-right font-bold text-slate-700 py-1.5 text-xs">કુલ ઉધાર સરવાળો :</td>
                            <td class="text-right font-black text-amber-800 text-xs">${formatINR(monthTotalExpCash)}</td>
                            <td class="text-right font-black text-indigo-800 text-xs">${formatINR(monthTotalExpBank)}</td>
                            <td class="text-right font-black text-rose-800 text-xs">${formatINR(monthTotalExpGrand)}</td>
                        </tr>
                        <tr class="bg-emerald-100/80">
                            <td colspan="6" class="text-right font-bold text-emerald-900 py-1.5 text-xs">શ્રી આખર બાકી (બંધ સિલક) :</td>
                            <td class="text-right font-black text-emerald-900 text-xs">${formatINR(monthTotalIncCash - monthTotalExpCash)}</td>
                            <td class="text-right font-black text-emerald-900 text-xs">${formatINR(monthTotalIncBank - monthTotalExpBank)}</td>
                            <td class="text-right font-black text-emerald-900 text-xs">${formatINR(monthTotalIncGrand - monthTotalExpGrand)}</td>
                        </tr>
                        <tr class="double-underline bg-slate-200">
                            <td colspan="6" class="text-right font-black text-slate-900 py-2.5 text-sm">એકંદરે કુલ સરવાળો :</td>
                            <td class="text-right font-black text-slate-900 text-sm">${formatINR(monthTotalIncCash)}</td>
                            <td class="text-right font-black text-slate-900 text-sm">${formatINR(monthTotalIncBank)}</td>
                            <td class="text-right font-black text-slate-900 text-sm">${formatINR(monthTotalIncGrand)}</td>
                        </tr>
                    </tfoot></table></div></div>`;
                }
                else {
                    uniqueDates.forEach((dateStr) => {
                        let dayTxns = displayData.filter(r => r.date === dateStr);
                        let incData = dayTxns.filter(r => parseFloat(r.income) > 0);
                        let expData = dayTxns.filter(r => parseFloat(r.expense) > 0);

                        let dayTotalIncomeCash = incData.reduce((sum, r) => sum + (r.chequeNo && String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeBank = incData.reduce((sum, r) => sum + (!r.chequeNo || !String(r.chequeNo).includes("[CASH]") ? parseFloat(r.income) : 0), 0);
                        let dayTotalIncomeGrand = dayTotalIncomeCash + dayTotalIncomeBank;

                        let dayTotalExpCash = expData.reduce((sum, r) => sum + (r.chequeNo && String(r.chequeNo).includes("[CASH]") ? parseFloat(r.expense) : 0), 0);
                        let dayTotalExpBank = expData.reduce((sum, r) => sum + (!r.chequeNo || !String(r.chequeNo).includes("[CASH]") ? parseFloat(r.expense) : 0), 0);
                        let dayTotalExpGrand = dayTotalExpCash + dayTotalExpBank;

                        let maxRows = Math.max(incData.length, expData.length, 1);

                        html += `<div class="page-chunk bg-white border-2 border-slate-500 rounded-xl mb-8 overflow-hidden w-full">`;
                        html += `<div class="bg-slate-100 border-b-2 border-slate-500 text-slate-800 p-2 text-center font-bold text-xs flex justify-between px-4 print-no-bg">
                            <span>A/C: ${escapeHtml(currentSchoolName)} (${accType})</span>
                            <span>વર્ષ: ${fyYear}</span>
                            <span>${bankDisplayStr || ''}</span>
                            <span>તારીખ: ${escapeHtml(dateStr)}</span>
                        </div>`;
                        html += `<table class="tally-table w-full">`;
                        html += `<thead class="print-no-bg"><tr class="bg-slate-50 border-b-2 border-slate-500">
                            <th colspan="7" class="border-r-2 border-slate-500 py-1.5 text-center font-black text-emerald-800">આવક (જમા) +</th>
                            <th colspan="9" class="py-1.5 text-center font-black text-rose-800">જાવક (ઉધાર) -</th>
                        </tr>
                        <tr class="text-slate-700 border-b-2 border-slate-500 bg-slate-50">
                            <th class="border-r border-slate-400">તારીખ</th><th class="border-r border-slate-400">હેડ</th><th class="border-r border-slate-400">આવકની વિગત</th>
                            <th class="border-r border-slate-400">ખા.પેજ</th><th class="border-r border-slate-400 text-amber-700">રોકડ</th>
                            <th class="border-r border-slate-400 text-indigo-700">બેંક</th><th class="border-r-2 border-slate-500">કુલ</th>
                            <th class="border-r border-slate-400">તારીખ</th><th class="border-r border-slate-400">હેડ</th><th class="border-r border-slate-400">જાવકની વિગત</th>
                            <th class="border-r border-slate-400">વા.નં.</th><th class="border-r border-slate-400">ચેક</th><th class="border-r border-slate-400">ખા.પેજ</th>
                            <th class="border-r border-slate-400 text-amber-700">રોકડ</th><th class="border-r border-slate-400 text-indigo-700">બેંક</th><th>કુલ</th>
                        </tr></thead><tbody>`;

                        for (let i = 0; i < maxRows; i++) {
                            let inc = incData[i] || { voucherNo: "-", purposeHead: "-", payeeName: "-", chequeNo: "-", income: 0, date: "-" };
                            let exp = expData[i] || { voucherNo: "-", purposeHead: "-", payeeName: "-", chequeNo: "-", expense: 0, date: "-" };
                            let iIsCash = inc.chequeNo && String(inc.chequeNo).includes("[CASH]");
                            let eIsCash = exp.chequeNo && String(exp.chequeNo).includes("[CASH]");
                            let iCashVal = inc.income > 0 && iIsCash ? formatINR(inc.income) : "-";
                            let iBankVal = inc.income > 0 && !iIsCash ? formatINR(inc.income) : "-";
                            let eCashVal = exp.expense > 0 && eIsCash ? formatINR(exp.expense) : "-";
                            let eBankVal = exp.expense > 0 && !eIsCash ? formatINR(exp.expense) : "-";
                            let iValTotal = inc.income > 0 ? formatINR(inc.income) : "-";
                            let eValTotal = exp.expense > 0 ? formatINR(exp.expense) : "-";
                            let rawIncHead = String(inc.purposeHead || "");
                            let incParts = rawIncHead.split(" || ");
                            let iHead = escapeHtml(incParts[0] || "-");
                            let iRemarks = escapeHtml(incParts[1] || "-");
                            let rawExpHead = String(exp.purposeHead || "");
                            let expParts = rawExpHead.split(" || ");
                            let eHead = escapeHtml(expParts[0] || "-");
                            let eRemarks = escapeHtml(expParts[1] || "-");
                            let iDesc = inc.income > 0 ? `<div class="font-bold text-slate-800">${escapeHtml(inc.payeeName)}</div><div class="text-[11px] text-slate-500">${iRemarks !== "-" ? iRemarks : 'આવક જમા'}</div>` : "-";
                            let eDesc = exp.expense > 0 ? `<div class="font-bold text-slate-800">${escapeHtml(exp.payeeName)}</div><div class="text-[11px] text-slate-500">${eRemarks !== "-" ? eRemarks : ''}</div>` : "-";
                            let eVch = exp.expense > 0 ? escapeHtml(exp.voucherNo) : "-";
                            let eChq = eIsCash ? "-" : (exp.chequeNo && exp.chequeNo !== "-" ? escapeHtml(exp.chequeNo) : "-");

                            html += `<tr class="border-b border-slate-300 hover:bg-slate-50">
                                <td class="border-r border-slate-300 font-bold">${escapeHtml(inc.date)}</td>
                                <td class="border-r border-slate-300 font-bold text-indigo-700">${iHead}</td>
                                <td class="border-r border-slate-300 text-left">${iDesc}</td>
                                <td class="border-r border-slate-300 font-bold text-indigo-600">${inc.income > 0 ? (escapeHtml(khatavahiPageMap[incParts[0]]) || "-") : "-"}</td>
                                <td class="border-r border-slate-300 text-right font-black text-amber-700">${iCashVal}</td>
                                <td class="border-r border-slate-300 text-right font-black text-indigo-700">${iBankVal}</td>
                                <td class="border-r-2 border-slate-500 text-right font-black text-emerald-700">${iValTotal}</td>
                                <td class="border-r border-slate-300 font-bold">${escapeHtml(exp.date)}</td>
                                <td class="border-r border-slate-300 font-bold text-indigo-700">${eHead}</td>
                                <td class="border-r border-slate-300 text-left">${eDesc}</td>
                                <td class="border-r border-slate-300 text-center font-bold">${eVch}</td>
                                <td class="border-r border-slate-300 font-mono text-[10px]">${eChq}</td>
                                <td class="border-r border-slate-300 font-bold text-indigo-600">${exp.expense > 0 ? (escapeHtml(khatavahiPageMap[expParts[0]]) || "-") : "-"}</td>
                                <td class="border-r border-slate-300 text-right font-black text-amber-700">${eCashVal}</td>
                                <td class="border-r border-slate-300 text-right font-black text-indigo-700">${eBankVal}</td>
                                <td class="text-right font-black text-rose-600">${eValTotal}</td>
                            </tr>`;
                        }

                        html += `<tr class="bg-emerald-50/50 font-bold border-b-2 border-slate-400">
                            <td colspan="4" class="text-right text-[11px]">તા. ${escapeHtml(dateStr)} કુલ જમા :</td>
                            <td class="text-right font-black text-amber-900 text-xs">${formatINR(dayTotalIncomeCash)}</td>
                            <td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalIncomeBank)}</td>
                            <td class="text-right font-black text-emerald-900 text-xs">${formatINR(dayTotalIncomeGrand)}</td>
                            <td colspan="6" class="text-right text-[11px]">તા. ${escapeHtml(dateStr)} કુલ ઉધાર :</td>
                            <td class="text-right font-black text-amber-900 text-xs">${formatINR(dayTotalExpCash)}</td>
                            <td class="text-right font-black text-indigo-900 text-xs">${formatINR(dayTotalExpBank)}</td>
                            <td class="text-right font-black text-rose-900 text-xs">${formatINR(dayTotalExpGrand)}</td>
                        </tr>`;
                        html += `</tbody></table></div>`;
                    });
                }
            }
            else if (currentReportType === 'ledger') {
                html += `<div class="page-chunk"><div class="mb-4 print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">(પરિશિષ્ટ નંબર-૨) આવક/ખર્ચનું વર્ગીકરણ (ખાતાવહી)</h2><div class="flex justify-between text-sm font-bold text-slate-700 border-b-2 border-slate-800 pb-2"><div class="text-left leading-relaxed">શાળાનું નામ : ${escapeHtml(currentSchoolName)}<br>સદર (હેડનું નામ) : <span class="text-blue-700 text-lg uppercase">${selectedHead === 'ALL' ? 'ALL HEADS' : escapeHtml(selectedHead)}</span></div><div class="text-right leading-relaxed text-sm">ખાતું : ${accType}<br>${bankObj.name ? escapeHtml(bankObj.name) : ''}</div></div></div><table class="tally-table border-2 border-slate-800 border-print w-full text-center"><thead class="bg-slate-100 print-no-bg"><tr class="border-b-2 border-slate-800 border-print"><th class="border border-slate-800 border-print">તારીખ</th><th class="border border-slate-800 border-print">પહોંચ નંબર<br>અને તારીખ</th><th class="border border-slate-800 border-print text-emerald-700">આવક<br>રકમ રૂ.</th><th class="border border-slate-800 border-print">વાઉચર નંબર<br>અને તારીખ</th><th class="border border-slate-800 border-print text-rose-700">ખર્ચની<br>રકમ રૂ.</th><th class="border border-slate-800 border-print">કેશબુક<br>પાના નંબર</th><th class="border border-slate-800 border-print w-1/4">રિમાર્ક્સ (વિગત)</th></tr><tr class="border-b-2 border-slate-800 border-print text-sm text-slate-600"><th class="border border-slate-800 border-print py-0.5">૧</th><th class="border border-slate-800 border-print py-0.5">૨</th><th class="border border-slate-800 border-print py-0.5">૩</th><th class="border border-slate-800 border-print py-0.5">૪</th><th class="border border-slate-800 border-print py-0.5">૫</th><th class="border border-slate-800 border-print py-0.5">૬</th><th class="border border-slate-800 border-print py-0.5">૭</th></tr></thead><tbody>`;
                
                let headGroups = {};
                displayData.forEach(r => { 
                    let h = String(r.purposeHead || ""); if(h && h.includes(" || ")) h = h.split(" || ")[0];
                    if(r.id === "OPENING-BAL" || (selectedHead !== 'ALL' && h !== selectedHead)) return; 
                    if(!headGroups[h]) headGroups[h] = []; headGroups[h].push(r); 
                });

                for(let h in headGroups) {
                    html += `<tr class="bg-slate-200 print-no-bg"><td colspan="7" class="text-left font-black text-slate-800 p-2 border border-slate-400">હેડ: ${escapeHtml(h)} (પાના નં: ${khatavahiPageMap[h]})</td></tr>`;
                    let tInc=0, tExp=0;
                    headGroups[h].forEach(r => {
                        let inc = parseFloat(r.income)||0; let exp = parseFloat(r.expense)||0; tInc += inc; tExp += exp;
                        let vchDesc = exp > 0 ? `${escapeHtml(r.voucherNo)}<br><span class="text-[10px] text-slate-500">${escapeHtml(r.date)}</span>` : "-";
                        let recDesc = inc > 0 ? `${escapeHtml(r.voucherNo)}<br><span class="text-[10px] text-slate-500">${escapeHtml(r.date)}</span>` : "-";
                        let isCash = r.chequeNo && String(r.chequeNo).includes('[CASH]');
                        
                        let extRem = ""; if(r.purposeHead && String(r.purposeHead).includes(" || ")) extRem = String(r.purposeHead).split(" || ")[1];
                        let remarks = `<div class="font-bold text-slate-800">${escapeHtml(r.payeeName)}</div>`;
                        if(extRem) remarks += `<div class="text-[11px] text-slate-600">${escapeHtml(extRem)}</div>`;
                        if(isCash) remarks += ' <span class="font-bold text-amber-600 text-[10px]">(CASH)</span>';
                        else if(r.chequeNo && r.chequeNo !== '-') remarks += ' <span class="font-mono text-slate-500 text-[10px]">(CHQ: ' + escapeHtml(r.chequeNo) + ')</span>';
                        
                        let cbPageNo = cashbookPageMap[r.date] || "-";

                        html += `<tr class="border-b border-slate-400 hover:bg-slate-50">
                            <td class="border-r border-slate-400 font-bold whitespace-nowrap">${escapeHtml(r.date)}</td>
                            <td class="border-r border-slate-400 text-center font-bold text-slate-600 leading-tight whitespace-nowrap">${recDesc}</td>
                            <td class="border-r border-slate-400 text-right font-black text-emerald-600 whitespace-nowrap">${inc>0 ? formatINR(inc) : "-"}</td>
                            <td class="border-r border-slate-400 text-center font-bold text-slate-600 leading-tight whitespace-nowrap">${vchDesc}</td>
                            <td class="border-r border-slate-400 text-right font-black text-rose-600 whitespace-nowrap">${exp>0 ? formatINR(exp) : "-"}</td>
                            <td class="border-r border-slate-400 text-center font-bold text-indigo-600 whitespace-nowrap">${cbPageNo}</td>
                            <td class="text-left">${remarks}</td>
                        </tr>`;
                    });
                    html += `<tr class="bg-slate-50 print-no-bg"><td colspan="2" class="text-right font-bold text-slate-600 border-r border-slate-400 p-2">કુલ:</td><td class="text-right font-black text-emerald-700 border-r border-slate-400 p-2 whitespace-nowrap">${formatINR(tInc)}</td><td class="border-r border-slate-400 p-2"></td><td class="text-right font-black text-rose-700 border-r border-slate-400 p-2 whitespace-nowrap">${formatINR(tExp)}</td><td colspan="2"></td></tr>`;
                }
               html += `</tbody></table></div>`;
            }

            else if (currentReportType === 'party') {
                html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">પાર્ટી / વેન્ડર વાઈઝ લેજર (Party Statement)</h2><div class="flex justify-between text-sm font-bold text-slate-700"><div class="text-left leading-relaxed">સંસ્થાનું નામ : ${escapeHtml(currentSchoolName)}<br>પાર્ટીનું નામ : <span class="text-indigo-700 text-lg uppercase">${selectedVendor === 'ALL' ? 'ALL PARTIES' : escapeHtml(selectedVendor)}</span></div><div class="text-right leading-relaxed text-sm">વર્ષ : ${fyYear}<br>Bank : ${escapeHtml(bankObj.name)}</div></div></div><table class="tally-table w-full text-center"><thead class="bg-slate-100 print-no-bg"><tr><th class="p-2">તારીખ</th><th class="p-2">વાઉચર/ચેક નંબર</th><th class="p-2">બિલની વિગત (હેડ)</th><th class="p-2">પાર્ટી / વેન્ડરનું નામ</th><th class="p-2 text-right text-emerald-700">આવક (+)</th><th class="p-2 text-right text-rose-700">ખર્ચ (-)</th><th class="p-2 text-right text-indigo-700">રનિંગ બેલેન્સ</th></tr></thead><tbody>`;
                
                let tInc = 0; let tExp = 0; let runBal = 0;
                let partyData = [...displayData].reverse();
                
                partyData.forEach((r, i) => { 
                    if(r.id === "OPENING-BAL") return;
                    let head = String(r.purposeHead || ""); if(head.includes(" || ")) head = head.split(" || ")[0];
                    let inc = parseFloat(r.income) || 0; let exp = parseFloat(r.expense) || 0;
                    tInc += inc; tExp += exp; runBal += (inc - exp);
                    let vchRef = r.chequeNo && r.chequeNo !== "-" && !String(r.chequeNo).includes("[CASH]") ? `${escapeHtml(r.voucherNo)}<br><span class="text-[10px] text-slate-500">${escapeHtml(r.chequeNo)}</span>` : escapeHtml(r.voucherNo);
                    html += `<tr class="hover:bg-slate-50"><td class="text-center font-bold whitespace-nowrap">${escapeHtml(r.date)}</td><td class="text-center font-bold text-slate-600">${vchRef}</td><td class="font-bold text-slate-700 text-left">${escapeHtml(head)}</td><td class="font-bold text-indigo-700 text-left">${escapeHtml(r.payeeName)}</td><td class="text-right font-black text-emerald-600">${inc > 0 ? formatINR(inc) : "-"}</td><td class="text-right font-black text-rose-600">${exp > 0 ? formatINR(exp) : "-"}</td><td class="text-right font-bold text-indigo-600">${formatINR(runBal)}</td></tr>`; 
                });
                
                if(partyData.length === 0 || (partyData.length === 1 && partyData[0].id === "OPENING-BAL")) {
                    html += `<tr><td colspan="7" class="text-center py-6 font-bold text-slate-400">આ પાર્ટીની કોઈ એન્ટ્રી નથી.</td></tr>`;
                } else {
                    html += `<tr class="bg-slate-100 print-no-bg border-t-2 border-slate-800 border-print"><td colspan="4" class="text-right font-bold text-slate-800 p-2">કુલ :</td><td class="text-right font-black text-emerald-700 p-2">${formatINR(tInc)}</td><td class="text-right font-black text-rose-700 p-2">${formatINR(tExp)}</td><td class="text-right font-black text-indigo-700 p-2">${formatINR(runBal)}</td></tr>`;
                    html += `<tr class="bg-indigo-50 print-no-bg"><td colspan="4" class="text-right font-bold text-indigo-900 p-2">શુદ્ધ લેવડ-દેવડ (Net Total) :</td><td colspan="3" class="text-center font-black text-indigo-900 p-2">${tInc > tExp ? formatINR(tInc - tExp) + " (આવક વધુ છે)" : formatINR(tExp - tInc) + " (ખર્ચ વધુ છે)"}</td></tr>`;
                }
                html += `</tbody></table></div>`;
            }

            else if (currentReportType === 'cheque') 
            { html += `<div class="page-chunk"><div class="mb-4 print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">વર્ષ દરમિયાનનું ચેકોનું નોંધપત્રક (ચેક રજીસ્ટર)</h2><div class="flex justify-between text-sm font-bold text-slate-700"><div class="text-left leading-relaxed">સંસ્થાનું નામ : ${escapeHtml(currentSchoolName)}</div><div class="text-right leading-relaxed text-sm">બેંક: ${escapeHtml(bankObj.name)} | A/c: ${escapeHtml(bankObj.accNo)}</div></div></div><table class="tally-table w-full text-center"><thead class="bg-slate-100 print-no-bg"><tr><th>ક્રમ</th><th>તારીખ</th><th>ચેક નંબર</th><th>વાઉચર નં</th><th class="w-1/3">પાર્ટી / કોને ચેક આપ્યો</th><th>બિલ હેડ વિગતો</th><th class="text-right text-rose-700">રકમ રૂ.</th><th>કેશબુક પા.નં.</th><th>સહી</th></tr></thead><tbody>`;
                let chqData = displayData.filter(r => parseFloat(r.expense) > 0 && r.chequeNo && r.chequeNo !== "-" && !String(r.chequeNo).includes('[CASH]'));
                chqData.forEach((r, i) => { 
                    let head = String(r.purposeHead || ""); if(head.includes(" || ")) head = head.split(" || ")[0];
                    html += `<tr class="hover:bg-slate-50"><td class="font-bold text-slate-500">${i+1}</td><td class="font-bold">${escapeHtml(r.date)}</td><td class="font-mono text-indigo-700 font-bold">${escapeHtml(r.chequeNo)}</td><td class="font-bold text-slate-500">${escapeHtml(r.voucherNo)}</td><td class="text-left font-bold text-slate-800">${escapeHtml(r.payeeName)}</td><td class="font-bold text-slate-600">${escapeHtml(head)}</td><td class="text-right font-black text-rose-600">${formatINR(r.expense)}</td><td class="text-center font-bold text-indigo-600">${cashbookPageMap[r.date] || "-"}</td><td></td></tr>`; 
                });
                if(chqData.length === 0) html += `<tr><td colspan="9" class="text-center py-6 font-bold text-slate-400">કોઈ ચેકની વિગત નથી.</td></tr>`;
                html += `</tbody></table></div>`;
            }
            
            else if (currentReportType === 'epayment') {
                html += `<div class="page-chunk"><table class="tally-table w-full text-center"><thead><tr><th>તારીખ</th><th>પાર્ટીનું નામ</th><th>ચેક/Ref નંબર</th><th class="text-right">રકમ</th><th>વા. નં.</th><th>હેડ</th></tr></thead><tbody>`;
                let dData = displayData.filter(r => r.id !== "OPENING-BAL");
                dData.forEach((r, i) => { 
                    let head = String(r.purposeHead || ""); if(head.includes(" || ")) head = head.split(" || ")[0];
                    html += `<tr><td>${escapeHtml(r.date)}</td><td class="font-bold text-slate-800 text-left">${escapeHtml(r.payeeName)}</td><td class="font-mono text-indigo-600 font-bold">${escapeHtml(r.chequeNo||"-")}</td><td class="text-right font-black ${parseFloat(r.income)>0?'text-emerald-600':'text-rose-600'}">${formatINR(parseFloat(r.income) > 0 ? r.income : r.expense)}</td><td class="text-center">${escapeHtml(r.voucherNo)}</td><td class="font-bold text-slate-600">${escapeHtml(head)}</td></tr>`; 
                });
                html += `</tbody></table></div>`;
            }
            
            else if (currentReportType === 'bill') {
                html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">વર્ષ દરમિયાનનું બિલોનું નોંધપત્રક (બિલ રજીસ્ટર)</h2><div class="flex justify-between text-sm font-bold text-slate-700"><div class="text-left leading-relaxed">સંસ્થાનું નામ : ${escapeHtml(currentSchoolName)}<br>ખાતું : ${accType}<br>A/c: ${escapeHtml(bankObj.accNo)}</div><div class="text-right leading-relaxed text-sm">વર્ષ : ${fyYear}<br>Bank : ${escapeHtml(bankObj.name)}</div></div></div><table class="tally-table w-full text-center"><thead class="bg-slate-100 print-no-bg"><tr><th class="p-2">વાઉચર<br>નંબર</th><th class="p-2 w-20">તારીખ</th><th class="p-2">બિલની વિગત (હેડ)</th><th class="p-2">પાર્ટીનું નામ</th><th class="p-2 text-right">બિલની રકમ</th><th class="p-2 text-right">કપાત</th><th class="p-2 text-right">ચુકવવાની થતી<br>ચોખ્ખી રકમ</th><th class="p-2">કેશબુક પા.નં.</th></tr></thead><tbody>`;
                let eData = displayData.filter(r => parseFloat(r.expense) > 0);
                eData.forEach((r, i) => { 
                    let head = String(r.purposeHead || ""); if(head.includes(" || ")) head = head.split(" || ")[0];
                    html += `<tr class="hover:bg-slate-50"><td class="text-center font-bold text-slate-600">${escapeHtml(r.voucherNo)}</td><td class="text-center whitespace-nowrap">${escapeHtml(r.date)}</td><td class="font-bold text-slate-700 text-left">${escapeHtml(head)}</td><td class="font-bold text-indigo-700 text-left">${escapeHtml(r.payeeName)}</td><td class="text-right font-black">${formatINR(r.expense)}</td><td class="text-right font-bold text-slate-400">0.00</td><td class="text-right font-black text-rose-600">${formatINR(r.expense)}</td><td class="text-center font-bold text-emerald-600">${cashbookPageMap[r.date] || "-"}</td></tr>`; 
                });
                html += `</tbody></table></div>`;
            }
            
            else if (currentReportType === 'voucherlist') {
                html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">વાઉચર રજીસ્ટર (વર્ષ: ${fyYear})</h2><div class="flex justify-between text-sm font-bold text-slate-700"><div class="text-left">સંસ્થાનું નામ : ${escapeHtml(currentSchoolName)}</div><div class="text-right">Bank: ${escapeHtml(bankObj.name)} | A/c: ${escapeHtml(bankObj.accNo)}</div></div></div><table class="tally-table w-full text-center"><thead class="bg-slate-100 print-no-bg"><tr><th class="p-2">વા.નં.</th><th class="p-2">તારીખ</th><th class="p-2">નાણા લેનાર</th><th class="p-2">સરનામું</th><th class="p-2">રૂપિયા</th><th class="p-2">પૈસા</th><th class="p-2">રૂપિયા શબ્દોમાં</th><th class="p-2 w-1/4">વાઉચરની વિગત</th><th class="p-2 w-1/6">અન્ય વિગતો</th></tr></thead><tbody>`;
                let vData = displayData.filter(r => parseFloat(r.expense) > 0);
                vData.forEach(r => {
                    let parts = String(r.purposeHead || "").split(" || ");
                    let headMain = parts[0] || ""; let headRemarks = parts[1] || "";
                    let address = parts[2] || "-"; let vt = parts[3] || `બા.જે. આજ રોજ વ્યવહાર હેડ: ${headMain} અન્વયે થયેલ છે.`;
                    
                    let isCash = r.chequeNo && String(r.chequeNo).includes('[CASH]');
                    if(!isCash && r.chequeNo && r.chequeNo !== '-') vt += `\n(ચેક/Ref: ${r.chequeNo})`;
                    
                    let exp = parseFloat(r.expense); let amtStr = exp.toFixed(2);
                    let rs = new Intl.NumberFormat('en-IN').format(amtStr.split('.')[0]); let ps = amtStr.split('.')[1] + "/-";
                    
                    let words = "શૂન્ય રૂપિયા";
                    if(typeof getGujaratiWords === 'function') words = getGujaratiWords(exp) + " પૂરા";
                    
                    let remarkDisplay = headRemarks ? "( વિગત :" + escapeHtml(headRemarks) + " )" : "-";

                    html += `<tr class="hover:bg-slate-50">
                        <td class="text-center font-bold text-slate-600">${escapeHtml(r.voucherNo)}</td>
                        <td class="text-center whitespace-nowrap">${escapeHtml(r.date)}</td>
                        <td class="font-bold text-indigo-700 text-left">${escapeHtml(r.payeeName)}</td>
                        <td class="text-center">${escapeHtml(address)}</td>
                        <td class="text-right font-black">${rs}</td>
                        <td class="text-center font-bold">${ps}</td>
                        <td class="text-left font-bold text-slate-700 text-[10px] leading-tight">${words}</td>
                        <td class="text-left text-[11px] leading-relaxed">${escapeHtml(vt)}</td>
                        <td class="text-center text-[10px] font-bold text-slate-600">${remarkDisplay}</td>
                    </tr>`;
                });
                if(vData.length === 0) html += `<tr><td colspan="9" class="text-center py-6 font-bold text-slate-400">કોઈ વાઉચરની વિગત નથી.</td></tr>`;
                html += `</tbody></table></div>`;
            }
            
            else if (currentReportType === 'grant') {
                html += `<div class="page-chunk"><div class="mb-4 text-center print-no-bg"><h2 class="text-center font-bold text-lg mb-2 text-slate-800">ગ્રાન્ટ રજીસ્ટર : પરિશિષ્ટ ૧૧</h2><div class="flex justify-between text-sm font-bold text-slate-700"><div class="text-left leading-relaxed">INSTITUTE: ${escapeHtml(currentSchoolName)}<br>A/C Holder: ${accType}</div><div class="text-right leading-relaxed text-sm">Year : ${fyYear}</div></div></div><table class="tally-table"><thead class="bg-slate-100 print-no-bg"><tr><th rowspan="2">ક્રમ</th><th rowspan="2">કોના તરફથી મળી</th><th rowspan="2">ગ્રાન્ટ જમા રકમ</th><th rowspan="2">ક્યાં કામે મળ્યા ? (Head)</th><th colspan="2" class="bg-indigo-50 border-b print-no-bg">બેંકમાં જમા કર્યાની વિગત</th><th rowspan="2">કોને ફાળવેલ</th><th rowspan="2">ખર્ચેલ રકમ</th><th rowspan="2">બચત ગ્રાન્ટ</th><th rowspan="2">રીમાર્કસ</th></tr><tr><th class="bg-indigo-50 print-no-bg">બેન્ક ખાતા નંબર</th><th class="bg-indigo-50 print-no-bg">બેન્કનું નામ</th></tr></thead><tbody>`;
                let groupedInc = {}; let groupedExp = {};
                displayData.forEach(r => { 
                    if(r.id==="OPENING-BAL") return; 
                    let h = String(r.purposeHead || "Unknown"); if(h.includes(" || ")) h = h.split(" || ")[0];
                    if(!groupedInc[h]) groupedInc[h]=0; if(!groupedExp[h]) groupedExp[h]=0; 
                    groupedInc[h] += parseFloat(r.income)||0; groupedExp[h] += parseFloat(r.expense)||0; 
                });
                let idx = 1; let gInc = 0; let gExp = 0;
                for (let h in groupedInc) { 
                    if(groupedInc[h] === 0 && groupedExp[h] === 0) continue;
                    gInc += groupedInc[h]; gExp += groupedExp[h]; let bal = groupedInc[h] - groupedExp[h];
                    html += `<tr><td class="text-center">${idx++}</td><td class="font-bold text-slate-600 text-center">GOG</td><td class="text-right font-black text-indigo-700">${formatINR(groupedInc[h])}</td><td class="font-bold text-slate-800">${escapeHtml(h)}</td><td class="text-center font-mono">${escapeHtml(bankObj.accNo)}</td><td class="text-center font-bold">${escapeHtml(bankObj.name)}</td><td class="text-center font-bold text-slate-600">${accType}</td><td class="text-right font-bold text-rose-600">${formatINR(groupedExp[h])}</td><td class="text-right font-black text-emerald-600">${formatINR(bal)}</td><td></td></tr>`; 
                }
                html += `<tr class="bg-slate-100 print-no-bg"><td colspan="2" class="text-right text-sm font-bold">કુલ રકમ :</td><td class="text-right font-black text-indigo-700 text-lg">${formatINR(gInc)}</td><td colspan="4"></td><td class="text-right font-black text-rose-600 text-lg">${formatINR(gExp)}</td><td class="text-right font-black text-emerald-600 text-lg">${formatINR(gInc-gExp)}</td><td></td></tr></tbody></table></div>`;
            }
            
            else if (currentReportType === 'p10') {
                let groupedInc = {}; let groupedExp = {};
                displayData.forEach(r => { 
                    if(r.id==="OPENING-BAL") return; 
                    let h = String(r.purposeHead || "Unknown"); if(h.includes(" || ")) h = h.split(" || ")[0];
                    if(!groupedInc[h]) groupedInc[h]=0; if(!groupedExp[h]) groupedExp[h]=0; 
                    groupedInc[h] += parseFloat(r.income)||0; groupedExp[h] += parseFloat(r.expense)||0; 
                });
                let gInc = 0; let gExp = 0; for(let h in groupedInc) { gInc += groupedInc[h]; gExp += groupedExp[h]; }
                let balAmt = gInc - gExp;
                
                let wInc = typeof getGujaratiWords === 'function' ? getGujaratiWords(gInc) : formatINR(gInc);
                let wExp = typeof getGujaratiWords === 'function' ? getGujaratiWords(gExp) : formatINR(gExp);
                let wBal = typeof getGujaratiWords === 'function' ? getGujaratiWords(balAmt) : formatINR(balAmt);
                
                html += `<div class="page-chunk"><div class="mb-6 text-center print-no-bg w-full lg:w-[90%] mx-auto">
                    <h2 class="text-center font-bold text-2xl mb-1 text-slate-800">પરિશિષ્ટ -૧૦</h2>
                    <h3 class="text-center font-bold text-lg mb-4 text-slate-600">ગ્રાન્ટ વપરાશ પ્રમાણપત્ર (વર્ષ : ${fyYear})</h3>
                    <p class="text-base font-bold text-slate-700 leading-relaxed text-justify indent-8 mb-6">
                        આથી પ્રમાણપત્ર આપવામાં આવે છે કે સને ${fyYear} નાણાકીય વર્ષમાં કુલ રૂ. ${formatINR(gInc)} (${wInc}) મળેલ છે. જે પૈકી રૂપિયા ${formatINR(gExp)} (${wExp}) ખર્ચ થયેલ છે. અગાઉના વર્ષની બચત સહિત <b>${escapeHtml(reportDynamicClosingDate)}</b> ના રોજ રૂપિયા ${formatINR(balAmt)} (${wBal}) બચત રહેલ છે. આ ઉપરાંત આવક અને ખર્ચના આંકડા સંબંધિત હિસાબી રેકર્ડ સાથે ચકાસણી કરીને દર્શાવેલા છે.
                    </p>
                    <div class="flex justify-between text-base font-bold text-slate-700 border-b-2 border-slate-500 pb-2 mb-4">
                        <div class="text-left">${escapeHtml(currentSchoolName)}<br>A/C No. ${escapeHtml(bankObj.accNo)}</div>
                        <div class="text-right">Bank: ${escapeHtml(bankObj.name)}</div>
                    </div>
                </div>
                <table class="tally-table w-full lg:w-[90%] mx-auto">
                <thead class="bg-slate-100 print-no-bg"><tr class="text-center"><th class="p-2">ક્રમ</th><th class="p-2">ગ્રાન્ટ / હેડની વિગત</th><th class="p-2">શરૂઆતની સિલક બેન્ક</th><th class="p-2">આ વર્ષ દરમ્યાન<br>બેન્કમાં મળેલ ગ્રાન્ટ</th><th class="p-2">કુલ ગ્રાન્ટ બેન્કમાં<br>(4+5)</th><th class="p-2">ખર્ચ / પરત કરેલ ગ્રાન્ટ</th><th class="p-2">રોકડ<br>(3+8-9)</th><th class="p-2">કુલ બંધ સિલક બેન્ક<br>(6-7)</th><th class="p-2">કુલ<br>(10+11)</th></tr><tr class="text-[10px] text-slate-500 bg-slate-200 print-no-bg"><th>1</th><th>2</th><th>4</th><th>5</th><th>6</th><th>7</th><th>10</th><th>11</th><th>12</th></tr></thead><tbody>`;
                let idx = 1; 
                for (let h in groupedInc) { 
                    if(groupedInc[h] === 0 && groupedExp[h] === 0) continue;
                    let bal = groupedInc[h] - groupedExp[h];
                    html += `<tr><td class="text-center">${idx++}</td><td class="font-bold text-indigo-700 text-sm p-2">${escapeHtml(h)}</td><td class="text-right p-2">0.00</td><td class="text-right p-2">${formatINR(groupedInc[h])}</td><td class="text-right font-black bg-indigo-50/30 print-no-bg p-2">${formatINR(groupedInc[h])}</td><td class="text-right font-bold text-rose-600 p-2">${formatINR(groupedExp[h])}</td><td class="text-right p-2">0.00</td><td class="text-right font-black text-emerald-600 p-2">${formatINR(bal)}</td><td class="text-right font-black text-slate-400 p-2">${formatINR(bal)}</td></tr>`; 
                }
                html += `<tr><td class="text-center p-2">0</td><td class="font-bold text-slate-600 text-sm p-2">રોકડ ખાતું/અનામત ખાતે</td><td class="text-right p-2">0.00</td><td class="text-right p-2">0.00</td><td class="text-right p-2">0.00</td><td class="text-right p-2">0.00</td><td></td><td></td><td></td></tr>`;
                html += `<tr class="bg-slate-100 print-no-bg"><th colspan="2" class="text-right text-base p-2">કુલ :</th><th class="text-right p-2">0.00</th><th class="text-right text-xl text-indigo-700 p-2">${formatINR(gInc)}</th><th class="text-right text-xl text-indigo-700 p-2">${formatINR(gInc)}</th><th class="text-right text-xl text-rose-600 p-2">${formatINR(gExp)}</th><th class="text-right p-2">0.00</th><th class="text-right text-xl text-emerald-600 p-2">${formatINR(balAmt)}</th><th class="text-right p-2">${formatINR(balAmt)}</th></tr></tbody></table></div>`;
            }
            
            else if (currentReportType === 'p9') {
                html += `<div class="page-chunk"><div class="mb-8 text-center print-no-bg w-full lg:w-[80%] mx-auto">
                    <h2 class="font-bold text-3xl text-slate-800 mb-2">પરિશિષ્ટ –9</h2>
                    <h3 class="font-bold text-xl text-slate-600">બેંક સાથે મેળવણું -રીકન્સીલેશન</h3>
                    <p class="text-base font-bold text-slate-500 mt-4 border-b-2 border-slate-400 pb-2 flex justify-between">
                        <span>વર્ષ : ${fyYear}</span> <span>A/C Holder: ${escapeHtml(currentSchoolName)}</span> <span>A/c No.: ${escapeHtml(bankObj.accNo)}</span>
                    </p>
                    <p class="text-sm font-bold text-slate-500 mt-2 text-right">તારીખ: <b>${escapeHtml(reportDynamicClosingDate)}</b></p>
                </div>
                <table class="tally-table w-full lg:w-[80%] mx-auto text-sm">
                <thead><tr><th class="p-3 text-sm">ક્રમ</th><th class="p-3 text-sm">વિગત</th><th class="text-right p-3 text-sm">પેટા રકમ</th><th class="text-right bg-indigo-50 print-no-bg p-3 text-sm">કુલ રકમ</th></tr></thead><tbody>
                <tr><td class="p-3"></td><td class="font-bold text-indigo-700 p-3 text-base">રોજમેળ પ્રમાણે તા. ${escapeHtml(reportDynamicClosingDate)} ની સિલક</td><td class="p-3"></td><td class="text-right font-bold p-3 text-base">0.00</td></tr>
                <tr><td class="font-bold text-emerald-600 p-3 text-base">(+)</td><td class="font-bold text-emerald-600 p-3 text-base">ઉમેરવું</td><td class="p-3"></td><td class="p-3"></td></tr>
                <tr><td class="p-3 text-base text-center">૧</td><td class="p-3 text-base">ચેક ઇસ્યુ થયા હોય પરંતુ વટાવેલ ન હોય.</td><td class="text-right p-3 text-base">0.00</td><td class="p-3"></td></tr>
                <tr><td class="p-3 text-base text-center">૨</td><td class="p-3 text-base">બેંકમાં જમા નોંધ થઇ હોય પરંતુ રોજમેળમાં દર્શાવ્યું ન હોય.</td><td class="text-right p-3 text-base">0.00</td><td class="text-right font-bold text-emerald-700 p-3 text-base">0.00</td></tr>
                <tr><td class="font-bold text-rose-600 p-3 text-base">(-)</td><td class="font-bold text-rose-600 p-3 text-base">બાદ કરવું.</td><td class="p-3"></td><td class="p-3"></td></tr>
                <tr><td class="p-3 text-base text-center">૧</td><td class="p-3 text-base">બેંકમાં મોકલવામાં આવેલી રોકડ કે ચેક બેંક ખાતામાં જમા ન થઇ હોય.</td><td class="text-right p-3 text-base">0.00</td><td class="p-3"></td></tr>
                <tr><td class="p-3 text-base text-center">૨</td><td class="p-3 text-base">બેંક ખાતામાં ઉધારવામાં આવેલ ચાર્જિસ પરંતુ તે રોજમેળમાં ઉલ્લેખ થયેલ ન હોય.</td><td class="text-right p-3 text-base">0.00</td><td class="text-right font-bold text-rose-600 p-3 text-base">0.00</td></tr>
                <tr class="bg-indigo-50/50 print-no-bg border-t-2 border-slate-500"><td class="p-4"></td><td class="font-bold text-slate-800 text-xl p-4">પાસબુક / બેંક સ્ટેટમેન્ટ પ્રમાણે સિલક</td><td class="p-4"></td><td class="text-right font-black text-2xl text-indigo-700 p-4">0.00</td></tr>
                </tbody></table></div>`;
            }

            html += '</div>'; 
            wrapper.innerHTML = html; 
            
            try { feather.replace(); } catch(e){}
            
        } catch(err) {
            console.error("Critical Render Error:", err);
            wrapper.innerHTML = `<div class="text-rose-500 font-bold p-4 bg-rose-50 rounded-xl border border-rose-200">System Render Error: ${err.message} <br><br> (કૃપા કરીને પેજ રિફ્રેશ કરો)</div>`;
        }
    }, 100);
}

function downloadCSV() {
    let tableWrapper = document.getElementById("tableWrapper");
    if(!tableWrapper) return;
    let table = tableWrapper.querySelector("table");
    if(!table) return Swal.fire('Error', 'કોઈ ડેટા ઉપલબ્ધ નથી.', 'error');
    
    let rows = table.querySelectorAll("tr");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    rows.forEach(row => {
        let rowData = [];
        row.querySelectorAll("th, td").forEach(cell => {
            let text = cell.innerText.replace(/"/g, '""').replace(/\n/g, ' - ');
            rowData.push('"' + text + '"');
        });
        csvContent += rowData.join(",") + "\r\n";
    });
    
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    let fileName = (typeof currentReportType !== 'undefined' ? currentReportType.toUpperCase() : 'LOCAL_FUND_REPORT') + "_" + new Date().getTime() + ".csv";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderLocalCharts(ledgerData) {
    let headTotals = {};
    let monthData = { inc: {}, exp: {} };

    ledgerData.forEach(r => {
        if(r.id === "OPENING-BAL") return;
        let inc = parseFloat(r.income) || 0;
        let exp = parseFloat(r.expense) || 0;
        
        let rawHead = String(r.purposeHead || ""); 
        let head = rawHead.includes(" || ") ? rawHead.split(" || ")[0] : (rawHead || "Other");
        
        if(exp > 0) {
            if(!headTotals[head]) headTotals[head] = 0;
            headTotals[head] += exp;
        }

        let parts = r.date.split('-'); 
        if(parts.length >= 2) {
            let mNum = parseInt(parts[1], 10);
            const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let mName = mNames[mNum - 1] || "Unknown";
            
            if(!monthData.inc[mName]) { monthData.inc[mName] = 0; monthData.exp[mName] = 0; }
            monthData.inc[mName] += inc;
            monthData.exp[mName] += exp;
        }
    });

    if(window.localPieChart) window.localPieChart.destroy();
    const ctxPie = document.getElementById('localExpenseChart');
    if(ctxPie && Object.keys(headTotals).length > 0) {
        window.localPieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: { 
                labels: Object.keys(headTotals), 
                datasets: [{ data: Object.values(headTotals), backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'] }] 
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: {font: {size: 10}} } } }
        });
    }

    if(window.localBarChart) window.localBarChart.destroy();
    const ctxBar = document.getElementById('localMonthlyChart');
    if(ctxBar && Object.keys(monthData.inc).length > 0) {
        let labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        let incArr = labels.map(l => monthData.inc[l] || 0);
        let expArr = labels.map(l => monthData.exp[l] || 0);

        window.localBarChart = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [
                    { label: 'આવક (+)', data: incArr, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'ખર્ચ (-)', data: expArr, backgroundColor: '#ef4444', borderRadius: 4 }
                ] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function downloadCSVTemplate() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Date(DD-MM-YYYY),VoucherNo,PartyName,BudgetHead,Income(Rs),Expense(Rs),ChequeNo,Remarks\n";
    csvContent += "01-04-2026,1,Ughadati Silak,Opening Balance,5000,0,-,શરૂઆતની સિલક\n";
    csvContent += "15-04-2026,2,ABC Stationers,સ્ટેશનરી ખર્ચ,0,150,-,પેન અને પેપર ખરીદી\n";

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Local_Fund_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleCSVUpload(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;
        let rows = text.split("\n").filter(row => row.trim() !== "");
        
        if(rows.length <= 1) return Swal.fire('Error', 'ફાઈલમાં કોઈ ડેટા નથી!', 'error');

        let expectedHeaders = "Date(DD-MM-YYYY),VoucherNo,PartyName,BudgetHead,Income(Rs),Expense(Rs),ChequeNo,Remarks";
        let uploadedHeaders = rows[0].replace(/"/g, "").trim();
        
        if (uploadedHeaders !== expectedHeaders) {
            document.getElementById('csvUploadInput').value = ""; 
            return Swal.fire('Format Error', 'ફાઈલનું ફોર્મેટ ખોટું છે! કૃપા કરીને "CSV નમૂનો" ડાઉનલોડ કરી તેમાં જ ડેટા પેસ્ટ કરો. કોલમના નામ બદલવા નહિ.', 'error');
        }

        let validDataPayload = [];
        let accType = document.getElementById('activeAccountType').value;

        for (let i = 1; i < rows.length; i++) {
            let cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"\vert{}"$/g, '').trim());
            
            if (cols.length < 8) continue; 

            let dDate = cols[0];
            let dVch = cols[1] || "AUTO";
            let dPayee = cols[2];
            let dHead = cols[3];
            let dInc = parseFloat(cols[4]) || 0;
            let dExp = parseFloat(cols[5]) || 0;
            let dChq = cols[6] || "-";
            let dRem = cols[7] || "";

            if(!dDate || !dPayee || !dHead || (dInc === 0 && dExp === 0)) continue; 

            let isInc = dInc > 0;
            let finalAmt = isInc ? dInc : dExp;
            let combinedPurpose = dRem ? `${dHead} || ${dRem}` : dHead;

            validDataPayload.push({
                accountType: accType,
                type: isInc ? 'INCOME' : 'EXPENSE',
                date: dDate,
                voucherNo: dVch,
                payeeName: dPayee.toUpperCase(),
                purposeHead: combinedPurpose,
                chequeNo: dChq,
                amount: finalAmt
            });
        }

        if (validDataPayload.length === 0) return Swal.fire('Error', 'ફાઈલમાં કોઈ યોગ્ય ડેટા મળ્યો નથી.', 'error');

        Swal.fire({
            title: 'ડેટા ચેક થઈ ગયો!',
            text: `કુલ ${validDataPayload.length} એન્ટ્રીઓ બરાબર છે. શું તમે આને સિસ્ટમમાં સેવ કરવા માંગો છો?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'હા, અપલોડ કરો',
            cancelButtonText: 'રદ કરો',
            confirmButtonColor: '#10b981'
        }).then((result) => {
            if (result.isConfirmed) {
                executeBulkUpload(validDataPayload);
            } else {
                document.getElementById('csvUploadInput').value = ""; 
            }
        });
    };
    reader.readAsText(file);
}

function executeBulkUpload(payloadArray) {
    Swal.fire({ title: 'Uploading...', text: 'ડેટા સેવ થઈ રહ્યો છે, કૃપા કરીને રાહ જુઓ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    google.script.run.withSuccessHandler(resResponse => {
        let res = typeof resResponse === 'string' ? JSON.parse(resResponse) : resResponse;
        if(res.success) {
            document.getElementById('csvUploadInput').value = ""; 
            localforage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
            localStorage.removeItem(`pmShriLedger_${currentUdise}_${document.getElementById('activeAccountType').value}`);
            loadLedger();
            Swal.fire('Success', 'બધો ડેટા સફળતાપૂર્વક અપલોડ થઈ ગયો છે!', 'success');
        } else {
            Swal.fire('Error', res.message, 'error');
        }
    }).withFailureHandler(err => {
        Swal.fire('Error', err.toString(), 'error');
    }).bulkSaveLocalVouchers(payloadArray, currentUdise);
}

function switchRegisterView(viewId) {
    document.querySelectorAll('.reg-view').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    document.querySelectorAll('.reg-tab-btn').forEach(btn => { btn.className = "reg-tab-btn flex-1 min-w-[120px] py-2.5 rounded-xl font-bold text-sm bg-white text-slate-500 hover:text-emerald-600 border border-slate-200 transition"; });

    let targetView = document.getElementById('reg-view-' + viewId);
    if(targetView) { targetView.classList.remove('hidden'); targetView.classList.add('block'); }
    
    let activeBtn = document.getElementById('btn-reg-' + viewId);
    if(activeBtn) { activeBtn.className = "reg-tab-btn flex-1 min-w-[120px] py-2.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm transition"; }

    if(viewId === 'meetings') renderDemoMeetings();
    if(viewId === 'stock') renderDemoStock();
    if(viewId === 'deadstock') renderDemoDeadstock();
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
}

function closeRegisterModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

let registersDataCache = { meetings: [], stock: [], deadstock: [] };

function loadOfficeRegistersData() {
    let tbody = document.getElementById('tbody-meetings');
    if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-bold">ડેટા લોડ થઈ રહ્યો છે...</td></tr>`;
    
    google.script.run.withSuccessHandler(res => {
        if(res && res.success) {
            registersDataCache = res.data;
            if(!document.getElementById('reg-view-meetings').classList.contains('hidden')) renderMeetingsTable();
            if(!document.getElementById('reg-view-stock').classList.contains('hidden')) renderStockTable();
            if(!document.getElementById('reg-view-deadstock').classList.contains('hidden')) renderDeadstockTable();
        }
    }).getOfficeRegistersData(currentSchool.udise);
}

function executeMasterSync() {
    Swal.fire({ title: '<span class="text-emerald-600">Global Sync Active 🔄</span>', html: 'સિસ્ટમ તમામ ડેટા લાઈવ અપડેટ કરી રહી છે...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    localStorage.removeItem('pmShriLocalHeads');
    localStorage.removeItem('pmShriLocalVendors');
    setTimeout(() => {
        loadLedger(); 
        Swal.fire({ icon: 'success', title: '100% Synced! ✨', text: 'તમામ ડેટા સફળતાપૂર્વક અપડેટ થઈ ગયો છે!', timer: 2000, showConfirmButton: false });
    }, 1500);
}

function lockApp() {
    Swal.fire({ title: 'સ્ક્રીન લોક 🔒', text: 'સુરક્ષા માટે તમારી સ્ક્રીન લોક થઈ ગઈ છે.', icon: 'info', timer: 1500, showConfirmButton: false }).then(() => {
        document.querySelector('main').style.display = 'none';
        document.querySelector('aside').style.display = 'none';
        alert("App Locked. Refresh page to login again."); 
    });
}

window.toggleDarkMode = function() {
    const htmlEl = document.documentElement;
    const icon = document.getElementById('darkModeIcon');
    if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark'); localStorage.setItem('localFundTheme', 'light');
        if(icon) { icon.setAttribute('data-feather', 'moon'); feather.replace(); }
    } else {
        htmlEl.classList.add('dark'); localStorage.setItem('localFundTheme', 'dark');
        if(icon) { icon.setAttribute('data-feather', 'sun'); feather.replace(); }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('localFundTheme') === 'dark') {
        document.documentElement.classList.add('dark');
        setTimeout(() => { let icon = document.getElementById('darkModeIcon'); if(icon) { icon.setAttribute('data-feather', 'sun'); feather.replace(); } }, 500);
    }
});

let spotlightActive = false;
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggleSpotlight(); }
    if (e.key === 'Escape' && spotlightActive) toggleSpotlight(false);
});

function toggleSpotlight(forceOpen = null) {
    const overlay = document.getElementById('spotlightOverlay');
    const input = document.getElementById('spotlightInput');
    if (!overlay || !input) return;
    if (forceOpen === false || spotlightActive) { overlay.classList.add('hidden'); spotlightActive = false; } 
    else {
        overlay.classList.remove('hidden'); input.value = '';
        document.getElementById('spotlightResults').innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">તમે શું શોધવા માંગો છો?<br><span class="text-xs font-medium">ટાઈપ કરો: કેશબુક, Cashbook, Form 27, મજૂર...</span></div>`;
        setTimeout(() => input.focus(), 50); spotlightActive = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let spotlightInput = document.getElementById('spotlightInput');
    if (spotlightInput) {
        spotlightInput.addEventListener('input', function(e) {
            let q = e.target.value.toLowerCase().trim();
            let resultsBox = document.getElementById('spotlightResults');
            if (!q) { resultsBox.innerHTML = ''; return; }

            const navCommands = [
                { keywords: ['dashboard', 'home', 'ડેશબોર્ડ'], title: 'ડેશબોર્ડ (Home)', type: 'Nav', action: "switchTab('dashboard')" },
                { keywords: ['voucher', 'વાઉચર', 'entry'], title: 'નવી એન્ટ્રી (Voucher)', type: 'Action', action: "switchTab('voucher')" },
                { keywords: ['manage', 'data', 'મેનેજ'], title: 'ડેટા મેનેજમેન્ટ', type: 'Nav', action: "switchTab('manage')" },
                { keywords: ['cashbook', 'રોજમેળ', 'કેશબુક'], title: 'Cashbook (કેશબુક)', type: 'Report', action: "switchTab('accounting'); setTimeout(()=>selectReport('cashbook', document.querySelector('.report-card')), 200);" },
                { keywords: ['khatavahi', 'ledger', 'ખાતાવહી'], title: 'Khatavahi (ખાતાવહી)', type: 'Report', action: "switchTab('accounting'); setTimeout(()=>selectReport('ledger', document.querySelectorAll('.report-card')[1]), 200);" },
                { keywords: ['register', 'દફ્તર', 'smc'], title: 'શાળા દફ્તર (Registers)', type: 'Nav', action: "switchTab('registers')" }
            ];
            let matches = navCommands.filter(cmd => cmd.title.toLowerCase().includes(q) || cmd.keywords.some(kw => kw.toLowerCase().includes(q)));
            if (matches.length === 0) { resultsBox.innerHTML = `<div class="p-6 text-center text-slate-400 font-bold">No results found</div>`; return; }
            let html = '';
            matches.forEach(m => {
                html += `<div class="spotlight-item p-3.5 border-b border-slate-100 hover:bg-slate-100 cursor-pointer flex justify-between transition" onclick="toggleSpotlight(false); ${m.action}">
                    <div class="font-bold text-slate-800 text-sm">${m.title}</div>
                    <div class="text-[9px] font-black uppercase text-slate-400 bg-white px-2 py-1 rounded border">${m.type}</div>
                </div>`;
            });
            resultsBox.innerHTML = html;
        });
    }
});

window.toggleAiChat = function() { document.getElementById('aiChatWindow').classList.toggle('hidden'); };
window.processLocalAIQuery = function() {
    let inputEl = document.getElementById('aiPrompt');
    let userQuery = inputEl.value.trim().toLowerCase();
    if (!userQuery) return;

    let chatHistory = document.getElementById('aiChatHistory');
    chatHistory.innerHTML += `<div class="flex items-start gap-2 justify-end view-enter"><div class="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tr-none shadow-md text-sm">${escapeHtml(userQuery)}</div></div>`;
    inputEl.value = ""; chatHistory.scrollTop = chatHistory.scrollHeight;

    setTimeout(() => {
        let aiResponse = "Local Fund ના ડેટાબેઝમાં આ માહિતી ઉપલબ્ધ નથી. માત્ર રકમ નાખીને પ્રયાસ કરો.";
        let numbers = userQuery.match(/\d+/g);
        
        if (numbers && numbers.length > 0) {
            let amount = Math.max(...numbers.map(Number)); 
            aiResponse = `<div class="border-l-4 border-emerald-500 pl-3">
                <h4 class="font-black text-slate-800 text-sm mb-1">ગણતરી (Smart Calc)</h4>
                <p class="text-xs font-bold text-slate-600">રકમ: ₹${formatINR(amount)}</p>
                <button onclick="switchTab('voucher'); document.getElementById('vAmt').value=${amount}; window.toggleAiChat();" class="mt-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold w-full">વાઉચર બનાવો (Magic Fill)</button>
            </div>`;
        }
        
        chatHistory.innerHTML += `<div class="flex items-start gap-2 view-enter"><div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 border border-emerald-200"><i data-feather="cpu" class="w-4 h-4 text-emerald-600"></i></div><div class="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-sm text-slate-700 text-sm">${aiResponse}</div></div>`;
        feather.replace(); chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 600);
};

window.startSmartTutorial = function(forceStart = false) {
    let tourKey = 'localTourSeen_' + (typeof currentUdise !== 'undefined' ? currentUdise : 'unknown');
    if (!forceStart && localStorage.getItem(tourKey) === "TRUE") return; 
    if (!window.driver || !window.driver.js || !window.driver.js.driver) return;

    if (!document.getElementById('driver-supreme-theme')) {
        const style = document.createElement('style');
        style.id = 'driver-supreme-theme';
        style.innerHTML = `
          body .driver-popover, body .driver-popover * {
              font-family: 'Anek Gujarati', 'Inter', sans-serif !important;
          }
          body .driver-popover {
              border-radius: 1.5rem !important;
              border: 1px solid rgba(16, 185, 129, 0.3) !important;
              box-shadow: 0 35px 60px -15px rgba(4, 120, 87, 0.4), 0 0 0 1.5px rgba(255, 255, 255, 0.8) inset !important;
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
          body .driver-popover-description b { color: #059669 !important; font-weight: 900 !important; }
          body .driver-popover-description ul { margin-top: 10px !important; padding-left: 0 !important; list-style-type: none !important; color: #475569 !important; }
          body .driver-popover-description li { margin-bottom: 8px !important; position: relative; padding-left: 22px !important; }
          body .driver-popover-description li::before { content: "🎯"; position: absolute; left: 0; top: 1px; font-size: 13px; }
          body .driver-popover-footer { margin-top: 26px !important; }
          body .driver-popover-footer button {
              font-weight: 900 !important; border-radius: 0.75rem !important; padding: 12px 24px !important;
              font-size: 15px !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          body .driver-popover-next-btn {
              background: linear-gradient(135deg, #10b981 0%, #047857 100%) !important; color: white !important;
              border: none !important; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important; text-shadow: none !important;
          }
          body .driver-popover-next-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.6) !important; }
          body .driver-popover-prev-btn { color: #64748b !important; background: #f8fafc !important; border: 1px solid #cbd5e1 !important; text-shadow: none !important; }
          body .driver-popover-prev-btn:hover { background: #f1f5f9 !important; color: #0f172a !important; border-color: #94a3b8 !important; }
          body .driver-popover-close-btn { color: #94a3b8 !important; top: 16px !important; right: 16px !important; transition: all 0.3s ease !important; }
          body .driver-popover-close-btn:hover { color: #e11d48 !important; transform: rotate(90deg) scale(1.2) !important; }
          body .driver-popover-progress-text { font-family: 'Inter', sans-serif !important; font-weight: 900 !important; color: #64748b !important; font-size: 14px !important; }
          path.driver-overlay-path { fill: rgba(15, 23, 42, 0.75) !important; }
        `;
        document.head.appendChild(style);
    }

    const driverObj = window.driver.js.driver({
        showProgress: true, animate: true, allowClose: false,
        doneBtnText: 'સમાપ્ત કરો 🚀', nextBtnText: 'આગળ સમજો →', prevBtnText: '← પાછળ',
        steps: [
            { element: '#activeAccountType', popover: { title: '૧. એકાઉન્ટ મેનેજર', description: 'અહીંથી તમારું SMCE, શાળા ફંડ, કે કસ્ટમ એકાઉન્ટ બદલી શકશો. માસ્ટર વ્યૂ (All Accounts) જોવા માટે પણ આ જ મેનુ છે.', side: "bottom", align: 'start' }, onHighlightStarted: () => { switchTab('dashboard'); window.scrollTo(0,0); } },
            { element: '#dt-voucher', popover: { title: '૨. વાઉચર એન્ટ્રી', description: 'કોઈપણ નવી આવક કે જાવક (ખર્ચ) ની નોંધ કરવા માટે આ મોડ્યુલનો ઉપયોગ કરો.', side: "right", align: 'center' } },
            { element: '#dt-accounting', popover: { title: '૩. રિપોર્ટ્સ', description: 'રોકડમેળ, ખાતાવહી, પાર્ટી લેજર અને ચેક રજીસ્ટર જેવા 6+ રિપોર્ટ્સ અહીંથી ડાઉનલોડ કે પ્રિન્ટ કરી શકાશે.', side: "right", align: 'center' } },
            { element: '#dt-settings', popover: { title: '૪. સેટિંગ્સ', description: 'નવા બજેટ હેડ બનાવવા, કસ્ટમ એકાઉન્ટ બનાવવા અને લોગો સેટ કરવા અહી જાવ.', side: "right", align: 'center' } },
            { element: 'header', popover: { title: '૫. સ્પોટલાઈટ સર્ચ (Ctrl+K)', description: 'સુપરફાસ્ટ સ્પીડ! તમે સિસ્ટમમાં ગમે ત્યાં હોવ, કીબોર્ડ પરથી <b>Ctrl + K</b> દબાવો અને મેનુ કે રિપોર્ટ સર્ચ કરો! 🎉 <b>ટ્યુટોરીયલ પૂરું!</b>', side: "bottom", align: 'center' } }
        ],
        onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("શું તમે આ ટ્યુટોરીયલ છોડવા માંગો છો?")) {
                driverObj.destroy(); localStorage.setItem(tourKey, "TRUE");
            }
        }
    });
    driverObj.drive();
};
