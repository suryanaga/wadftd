import { VERSION } from './version.js';
console.log('📦 Script version (initial):', VERSION);

document.addEventListener("DOMContentLoaded", function() {
  // ─── Basic Setup ───────────────────────────────────────────────────
  const MIN_PERCENTAGE = 1; // Minimum width % for any section

  // Disable later pledge sections on load
  ["pledgeSection2","pledgeSection3","pledgeSection4"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("pledge-section-disabled","pledge-section-overlay");
  });

  // Charity images lookup
  const defaultCharityImages = {
    "Future Dharma": "https://cdn.prod.website-files.com/66cdebdbbd868704132ec32f/673c805ce322ad4e4f4a0c5e_FD-logo_icon--coloured--250px.png",
    "Order Office":  "https://cdn.prod.website-files.com/66cdebdbbd868704132ec32f/673c809e757d3f3b9e945446_kesa%20emblem.png"
  };
  const charityTypeImages = {
    "International": "https://cdn.prod.website-files.com/66cddc57f886c22c624244dc/672c93a99c106ad5d0006ad0_Warm%20Gradient%20Abstract%20ALT.avif",
    "Local":         "https://cdn.prod.website-files.com/66cddc57f886c22c624244dc/6728c5be93d6a63d4475aa46_Painting%203%20new.avif",
    "Retreat/GFR":   "https://cdn.prod.website-files.com/66cddc57f886c22c624244dc/67322b0aeb4ef255c66d5694_Painted%201.avif"
  };

  // ─── Currency Handling (symbol + code display) ────────────────────
  const currencyMap = {
    USD: { symbol: '$', display: '$USD', code: 'USD' },
    NZD: { symbol: '$', display: '$NZD', code: 'NZD' },
    AUD: { symbol: '$', display: '$AUD', code: 'AUD' },
    MXN: { symbol: '$', display: '$MXN', code: 'MXN' },
    GBP: { symbol: '£', display: '£GBP', code: 'GBP' },
    EUR: { symbol: '€', display: '€EUR', code: 'EUR' },
    INR: { symbol: '₹', display: '₹INR', code: 'INR' }
  };

  function resolveCurrency(selectionValue) {
    // Try by code first (e.g. "USD"), then by raw symbol (e.g. "$"), else default to GBP
    if (currencyMap[selectionValue]) return currencyMap[selectionValue];
    const bySymbol = Object.values(currencyMap).find(c => c.symbol === selectionValue);
    return bySymbol || currencyMap.GBP;
  }

  function getSelectedCurrency() {
    const code     = localStorage.getItem('selectedCurrencyCode');
    const display  = localStorage.getItem('selectedCurrencyDisplay');
    const symbol   = localStorage.getItem('selectedCurrencySymbol');
    if (code && display && symbol) return { code, display, symbol };
    // Fallback
    const d = currencyMap.GBP;
    return { code: d.code, display: d.display, symbol: d.symbol };
  }

  // Prevent Enter from submitting the email form
  document.getElementById("email-form-2").addEventListener("keydown", e => {
    if (e.key === "Enter") e.preventDefault();
  });

  // ─── Error Message Helpers ─────────────────────────────────────────
  function showMaxCharitiesError() {
    if (!document.getElementById("max-charity-error")) {
      const err = document.createElement("div");
      err.id = "max-charity-error";
      err.className = "text-size-medium text-align-center padding-small";
      Object.assign(err.style, {
        color: "white",
        backgroundColor: "#f85050",
        marginTop: "10px"
      });
      err.textContent = "You cannot add more than 7 charities. Please remove one before adding another.";
      document.getElementById("dragHeading")?.insertAdjacentElement("afterend", err);
    }
  }
  function removeMaxCharitiesError() {
    document.getElementById("max-charity-error")?.remove();
  }

  // ─── Step 1: Calculate Daily Income ─────────────────────────────────
  document.getElementById("calcBtn1").addEventListener("click", function(e) {
    e.preventDefault();

    // Enable Section 2
    document.getElementById("pledgeSection2")
      .classList.remove("pledge-section-disabled","pledge-section-overlay");

    // Get and store currency
    const currencySelection = document.getElementById('currencySelector').value; // may be a code (USD) or a symbol ($)
    const cur = resolveCurrency(currencySelection);
    localStorage.setItem('selectedCurrencyCode', cur.code);
    localStorage.setItem('selectedCurrencyDisplay', cur.display);
    localStorage.setItem('selectedCurrencySymbol', cur.symbol);
    replaceCurrencySymbols();

    // Calculate daily income
    const monthly = parseFloat(document.getElementById("monthlyIncome").value);
    if (isNaN(monthly) || monthly <= 0) {
      return alert("Please enter a valid monthly income.");
    }
    let daily = Math.round((monthly / 21.67) * 2) / 2;
    localStorage.setItem("dailyIncome", daily.toFixed(2));

    // Scroll to Section 2 and open its accordion
    document.getElementById("s2-head").scrollIntoView({ behavior: "smooth" });
    document.getElementById("s2-head").click();
    const { display: currencyDisplay } = getSelectedCurrency();
    document.getElementById('oneDayForYou').textContent = `${currencyDisplay}${daily.toFixed(2)}`;

    // Update radio labels
    updateRadioButton('1-Day',    daily,       '1 Day',  currencyDisplay);
    updateRadioButton('Half-Day', daily / 2,   '1/2 Day',currencyDisplay);
    updateRadioButton('1.5-Days', daily * 1.5, '1.5 Days',currencyDisplay);
    updateRadioButton('2-Days',   daily * 2,   '2 Days', currencyDisplay);

    // now pre-select the 1-Day option (and fire Webflow's UI logic)
    const oneDay = document.getElementById("1-Day");
    if (oneDay) oneDay.click();

    // If not an Order Member, remove “Order Office”
    if (!document.getElementById("radio").checked) {
      removeCharityByName("Order Office");
    }
  });

  function replaceCurrencySymbols() {
    const { display } = getSelectedCurrency();
    const pattern = /(\$USD|\$NZD|\$AUD|\$MXN|£GBP|€EUR|₹INR|[$£€₹])/g;
    document.querySelectorAll(
      '.amount-money, .total-gift-amount, #oneDayForYou, .w-form-label'
    ).forEach(el => {
      el.textContent = (el.textContent || '').replace(pattern, display);
    });
  }

  function updateRadioButton(id, value, label, currencyDisplay) {
    const rounded = Math.round(value * 2) / 2;
    const radio = document.getElementById(id);
    const lab   = document.querySelector(`span[for='${id}']`);
    if (radio && lab) {
      radio.dataset.amount = rounded;
      lab.textContent = `${label} (${currencyDisplay}${rounded.toFixed(2)})`;
    }
  }

  // ─── Step 2: User Chooses How Many Days ──────────────────────────────
  document.getElementById("calcBtn2").addEventListener("click", function(e) {
    e.preventDefault();

    // Enable Section 3
    document.getElementById("pledgeSection3")
      .classList.remove("pledge-section-disabled","pledge-section-overlay");

    const selectedRadio = document.querySelector("input[name='radioDayChoice']:checked");
    if (!selectedRadio) {
      return alert("Please select an amount to give.");
    }

    const totalAmount = parseFloat(selectedRadio.getAttribute("data-amount"));
    if (isNaN(totalAmount)) {
      return alert("Invalid amount selected. Please try again.");
    }

    const allocationBar = document.getElementById("allocation-bar");
    if (!allocationBar) {
      console.error("Element with ID 'allocation-bar' not found.");
      return;
    }
    //Clear allocation bar
    allocationBar.innerHTML = "";

    allocationBar.dataset.totalAmount = totalAmount;

    // ─── Pre-select default charities ─────────────────────────────────
      // ─── Pre-check the two boxes via their change listeners ─────────────────
      // (and debug to console if they’re ever missing)
      const fdCheckbox = document.querySelector(
        'input[type="checkbox"][data-item-name="Future Dharma"]'
      );
      console.log("FD checkbox found?", fdCheckbox);
      if (fdCheckbox) {
        fdCheckbox.checked = true;
        // fire a proper bubbling change event
        fdCheckbox.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      } else {
        console.warn("Couldn't find Future Dharma checkbox – check your data-item-name!");
      }
    
      // Only pre-check Order Office if they’re an Order member
      // ─── Only pre-check Order Office if the first “radio” (Yes) is checked ──
      const radios = document.getElementsByName("radio");
      // radios[0] is your “Yes” button, radios[1] is “No”
      if (radios[0]?.checked) {
        const ooCheckbox = document.querySelector(
          'input[type="checkbox"][data-item-name="Order Office"]'
        );
        if (ooCheckbox) {
          ooCheckbox.checked = true;
          ooCheckbox.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        }
      }

    // Distribute existing charities equally
    updateTotal();

    // Scroll to Section 3 and open its accordion
    document.getElementById("s3-head").scrollIntoView({ behavior: "smooth" });
    document.getElementById("s3-head").click();
  });

  // ─── Step 3: Final Summary ──────────────────────────────────────────
  document.getElementById("calcBtn3").addEventListener("click", function(e) {
    e.preventDefault();

    // Enable Section 4
    document.getElementById("pledgeSection4")
      .classList.remove("pledge-section-disabled","pledge-section-overlay");

    const allocationBar = document.getElementById("allocation-bar");
    const totalAmount = parseFloat(allocationBar.dataset.totalAmount);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return alert("Invalid pledge amount. Please ensure you have selected an amount to give.");
    }

    const charities = document.querySelectorAll(".allocation-section");
    if (charities.length === 0) {
      return alert("Please add at least one charity to allocate your gift.");
    }

    const { display: summaryCurrency } = getSelectedCurrency();

    let summaryHTML = `
      <p>You are pledging to give <strong>${summaryCurrency}${totalAmount.toFixed(2)}</strong> each month, split across:</p>
      <table class="pledge-summary-table">
        <tr>
          <th>Charity</th>
          <th>Amount</th>
        </tr>`;

    // Get the form element
    const pledgeForm = document.getElementById("wf-form-WADFTD-Pledge-Form-Final");
    if (!pledgeForm) {
      console.error("Pledge form not found!");
      return;
    }

    // Remove previous hidden inputs to prevent duplication
    document.querySelectorAll(".pledge-hidden-input").forEach(input => input.remove());

    // Add hidden input for total gift amount
    const totalGiftInput = document.createElement("input");
    totalGiftInput.type = "hidden";
    totalGiftInput.name = "TotalGift";
    totalGiftInput.value = totalAmount.toFixed(2);
    totalGiftInput.classList.add("pledge-hidden-input");
    pledgeForm.appendChild(totalGiftInput);

    // Loop through charities and add them to the table and form
    let charityIndex = 1;
    charities.forEach(charity => {
      const charityName   = charity.querySelector(".allocator--charity-name").textContent.trim();
      const charityAmount = charity.querySelector(".amount-money").textContent.trim();

      summaryHTML += `
        <tr>
          <td>${charityName}</td>
          <td>${charityAmount}</td>
        </tr>`;

      // Create hidden inputs for each charity
      const charityNameInput = document.createElement('input');
      charityNameInput.type = 'hidden';
      charityNameInput.name = `Charity${charityIndex}Name`;
      charityNameInput.value = charityName;
      charityNameInput.classList.add('pledge-hidden-input');
      pledgeForm.appendChild(charityNameInput);

      const charityAmountInput = document.createElement('input');
      charityAmountInput.type = 'hidden';
      charityAmountInput.name = `Charity${charityIndex}Amount`;
      // Store exactly what is shown to the user, e.g. "$USD12.50"
      charityAmountInput.value = charityAmount;
      charityAmountInput.classList.add('pledge-hidden-input');
      pledgeForm.appendChild(charityAmountInput);

      charityIndex++;
    });

    summaryHTML += `</table>`;
    document.getElementById("pledge-summary").innerHTML = summaryHTML;

    // Scroll to Section 4 and open its accordion
    document.getElementById("s4-head").scrollIntoView({ behavior: "smooth" });
    document.getElementById("s4-head").click();
  });

  // ─── Filtering Charities by Search ─────────────────────────────────
  function filterCharities(input) {
    const q = input.value.toLowerCase();
    const listWrap = input.closest(".searchbar--container")
                         .querySelector(".autocomplete--list-container");
    listWrap?.querySelectorAll(".autocomplete--item").forEach(item => {
      item.style.display = item.dataset.itemName
        .toLowerCase()
        .includes(q) ? "flex" : "none";
    });
  }
  document.querySelectorAll(".searchbar").forEach(input => {
    input.addEventListener("input", () => filterCharities(input));
  });

  // ─── Open & Close the Autocomplete Dropdown ─────────────────────────
  document.querySelectorAll(".searchbar").forEach(searchInput => {
    const container = searchInput.closest(".searchbar--container");
    const listWrap  = container.querySelector(".autocomplete--list-container");

    function openList() {
      listWrap.style.maxHeight = listWrap.scrollHeight + "px";
    }
    searchInput.addEventListener("focus", openList);
    searchInput.addEventListener("click", openList);
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".searchbar--container")) {
      document.querySelectorAll(".autocomplete--list-container")
        .forEach(w => w.style.maxHeight = "0");
    }
  });

  // Delegate checkbox changes for all charities (static & CMS-loaded)
  document.addEventListener('change', e => {
    const cb = e.target;
    if (cb.matches('input[type="checkbox"][data-item-name]')) {
      const name = cb.dataset.itemName;
      const listContainer = cb.closest('.autocomplete--list-container');
      const type = listContainer?.dataset.charityType || null;
      if (cb.checked) addCharityByName(name, type);
      else             removeCharityByName(name);
      updateTotal();
    }
  });

  function sanitizeId(str) {
    return str.replace(/\W+/g, '');
  }

  // ─── Add Charity by Name ──────────────────────────────────────────
  function addCharityByName(name, charityType) {
    const bar = document.getElementById("allocation-bar");
    if (!bar) return console.error("Allocation bar not found");
    const count = bar.querySelectorAll(".allocation-section").length;
    if (count >= 7) {
      showMaxCharitiesError();
      // Uncheck the box since we can’t add more
      document.querySelector(`.autocomplete--checkbox[data-item-name="${name}"]`).checked = false;
      return;
    }
    removeMaxCharitiesError();

    const id = sanitizeId(name);
    if (document.getElementById(`charity-${id}`)) {
      // Already present → just leave it checked
      return;
    }

    // Determine background style
    let bg = "";
    if (defaultCharityImages[name]) {
      bg = `background-image:url('${defaultCharityImages[name]}');`;
    } else if (charityType && charityTypeImages[charityType]) {
      bg = `background-image:url('${charityTypeImages[charityType]}'); background-size:cover; background-position:center;`;
    }

    // Create the new section
    const sec = document.createElement("div");
    sec.className = "allocation-section";
    sec.id = `charity-${id}`;
    sec.innerHTML = `
      <div class="bar-slider--portion" style="${bg}"></div>
      <div class="amounts-container">
        <div class="amount-percent text-size-medium center-this"></div>
        <div class="amount-money  text-size-medium center-this"></div>
        <a class="remove-charity w-button" data-charity-id="${name}">Remove</a>
      </div>
      <div class="allocator--charity-name">${name}</div>
    `;
    bar.appendChild(sec);

    updateTotal();
    rebuildBoundaryHandles();
  }

  // ─── Remove Charity by Name ───────────────────────────────────────
  function removeCharityByName(name) {
    const id = sanitizeId(name);

    // 1) Remove the allocation‐bar section
    document.getElementById(`charity-${id}`)?.remove();

    // 2) Uncheck the matching checkbox
    const cb = document.querySelector(`.autocomplete--checkbox[data-item-name="${name}"]`);
    if (cb) cb.checked = false;

    // 3) Any error banner should go away
    removeMaxCharitiesError();

    // 4) Recompute widths & handles
    updateTotal();
    rebuildBoundaryHandles();
  }

  // “Remove” links also uncheck the corresponding checkbox
  document.getElementById("allocation-bar").addEventListener("click", function(e) {
    if (e.target.classList.contains("remove-charity")) {
      const name = e.target.dataset.charityId;
      removeCharityByName(name);
      const cb = document.querySelector(`.autocomplete--checkbox[data-item-name="${name}"]`);
      if (cb) cb.checked = false;
    }
  });

  // ─── Helpers: Update Totals & Build Handles ───────────────────────
  function updateTotal() {
    console.log('🔄 updateTotal fired; sections =', document.querySelectorAll('.allocation-section').length);

    const bar = document.getElementById("allocation-bar");
    const totalAmount = parseFloat(bar.dataset.totalAmount) || 0;
    const secs = [...bar.querySelectorAll(".allocation-section")];
    if (!secs.length) return;

    // Equal distribution (with rounding)
    let eqPct = Math.round((100 / secs.length) * 100) / 100;
    let remainder = 100 - eqPct * secs.length;
    secs.forEach((sec, i) => {
      let portion = eqPct;
      if (remainder > 0) { portion++; remainder--; }
      else if (remainder < 0) { portion--; remainder++; }
      sec.style.width = portion + "%";
      updateLabel(sec);
    });

    updateTotalGiftAmount();
  }

  function rebuildBoundaryHandles() {
    console.log('🔧 rebuildBoundaryHandles invoked');
    
    const bar = document.getElementById("allocation-bar");
    bar.querySelectorAll(".boundary-handle").forEach(h => h.remove());
    const secs = [...bar.querySelectorAll(".allocation-section")];
    if (secs.length < 2) return;

    let cum = 0;
    secs.forEach((sec, i) => {
      const w = parseFloat(sec.style.width) || 0;
      cum += w;
      if (i < secs.length - 1) {
        const handle = document.createElement("div");
        handle.className = "boundary-handle";
        handle.dataset.leftIndex  = i;
        handle.dataset.rightIndex = i + 1;
        handle.style.left = cum + "%";
        bar.appendChild(handle);
      }
    });
    attachBoundaryDragHandlers();
  }

  function positionBoundaryHandles() {
    const bar = document.getElementById("allocation-bar");
    const secs = [...bar.querySelectorAll(".allocation-section")];
    const handles = [...bar.querySelectorAll(".boundary-handle")];
    let cum = 0;
    secs.forEach((sec, i) => {
      const w = parseFloat(sec.style.width) || 0;
      cum += w;
      if (handles[i]) handles[i].style.left = cum + "%";
    });
  }

  function attachBoundaryDragHandlers() {
    document.querySelectorAll(".boundary-handle").forEach(handle => {
      handle.removeEventListener("mousedown", startBoundaryDrag);
      handle.removeEventListener("touchstart", startBoundaryDrag);
      handle.addEventListener("mousedown", startBoundaryDrag);
      handle.addEventListener("touchstart", startBoundaryDrag, { passive:false });
    });
  }

  function startBoundaryDrag(e) {
    e.preventDefault();
    const handle = e.target;
    const bar = document.getElementById("allocation-bar");
    const totalPx = bar.offsetWidth;
    const leftIdx  = +handle.dataset.leftIndex;
    const rightIdx = +handle.dataset.rightIndex;
    const secs = [...bar.querySelectorAll(".allocation-section")];
    const leftSec = secs[leftIdx];
    const rightSec= secs[rightIdx];
    let leftStart  = parseFloat(leftSec.style.width)  || 0;
    let rightStart = parseFloat(rightSec.style.width) || 0;
    const sumStart = leftStart + rightStart;
    const startX = (e.type === "touchstart" ? e.touches[0] : e).clientX;

    function onMove(ev) {
      ev.preventDefault();
      const curX = (ev.type === "touchmove" ? ev.touches[0] : ev).clientX;
      const deltaPx = curX - startX;
      const deltaPct= (deltaPx / totalPx) * 100;
      let newLeft  = Math.max(MIN_PERCENTAGE, leftStart  + deltaPct);
      let newRight = Math.max(MIN_PERCENTAGE, rightStart - deltaPct);
      const ratio = sumStart / (newLeft + newRight);
      newLeft  *= ratio;
      newRight *= ratio;
      leftSec.style.width  = newLeft.toFixed(2) + "%";
      rightSec.style.width = newRight.toFixed(2) + "%";
      updateLabel(leftSec);
      updateLabel(rightSec);
      positionBoundaryHandles();
    }

    function onEnd() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup",   onEnd);
      document.removeEventListener("touchend",  onEnd);
    }

    document.addEventListener("mousemove", onMove,   { passive:false });
    document.addEventListener("touchmove",   onMove,   { passive:false });
    document.addEventListener("mouseup",     onEnd);
    document.addEventListener("touchend",    onEnd);
  }

  function updateLabel(sec) {
    const bar = document.getElementById("allocation-bar");
    const totalAmount = parseFloat(bar.dataset.totalAmount) || 0;
    const { display: currency } = getSelectedCurrency();
    const pct = Math.round(parseFloat(sec.style.width) || 0);
    const amt = Math.round(((pct / 100) * totalAmount) * 2) / 2;
    sec.querySelector(".amount-percent").textContent = `${pct}%`;
    sec.querySelector(".amount-money").textContent   = `${currency}${amt.toFixed(2)}`;
  }

  function updateTotalGiftAmount() {
    const bar = document.getElementById("allocation-bar");
    const total = parseFloat(bar.dataset.totalAmount) || 0;
    const { display: currency } = getSelectedCurrency();
    document.querySelector(".total-gift-amount")
            .textContent = `${currency}${total.toFixed(2)}`;
  }
});