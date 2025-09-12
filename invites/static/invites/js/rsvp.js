(function () {
  const el = id => document.getElementById(id);

  function safeParseJSON(id, fallback) {
    const node = el(id);
    if (!node) return fallback;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      console.error(`Invalid JSON in #${id}`, e);
      return fallback;
    }
  }

  const existingPersons = safeParseJSON('existingPersons-data', []);
  const initialGuests = window.defaultGuests ?? safeParseJSON('initialGuests-data', 1);
  const attendingState = safeParseJSON('initialAttending-data', null);

  const attendYes = document.querySelector('input[name="attending"][value="True"]');
  const attendNo = document.querySelector('input[name="attending"][value="False"]');
  const details = el('attend-details');
  const guestRange = el('guest-count'); // Range oder Hidden
  const guestDisplay = el('guest-count-display');
  const personsContainer = el('persons-container');

  function showHideDetails() {
    if (!details) return;
    details.style.display = attendYes && attendYes.checked ? 'block' : 'none';
  }

  function createPersonBlock(index, person) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card mb-3 p-3 shadow-sm';
    const header = document.createElement('h5');
    header.className = 'card-title mb-3';
    header.textContent = `Person ${index + 1}`;
    wrapper.appendChild(header);

    const nameGroup = document.createElement('div');
    nameGroup.className = 'mb-3';
    nameGroup.innerHTML = `
      <label class="form-label">Name</label>
      <input type="text" name="person_name[]" class="form-control" required value="${person.name || ''}">
    `;
    wrapper.appendChild(nameGroup);

    const dietGroup = document.createElement('div');
    dietGroup.className = 'mb-3';
    const dietLabel = document.createElement('label');
    dietLabel.className = 'form-label';
    dietLabel.textContent = 'Essgewohnheit';
    dietGroup.appendChild(dietLabel);

    const dietSelect = document.createElement('select');
    dietSelect.name = 'person_diet[]';
    dietSelect.className = 'form-select';
    ['Vegan', 'Vegetarisch', 'Omnivor'].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      if (person.diet === option) opt.selected = true;
      dietSelect.appendChild(opt);
    });
    dietGroup.appendChild(dietSelect);

    // Popover für Omnivor
    const popoverBtn = document.createElement('a');
    popoverBtn.setAttribute('tabindex', '0');
    popoverBtn.className = 'btn btn-sm btn-danger ms-2';
    popoverBtn.setAttribute('role', 'button');
    popoverBtn.setAttribute('data-bs-toggle', 'popover');
    popoverBtn.setAttribute('data-bs-trigger', 'focus');
    popoverBtn.setAttribute('data-bs-title', 'Hinweis');
    popoverBtn.setAttribute('data-bs-content', 'Auf unserer Hochzeit wird nur vegetarisches & veganes Essen geben. Wir bedanken uns für dein/euer Verständnis.');
    popoverBtn.textContent = 'Info';
    popoverBtn.style.display = dietSelect.value === 'Omnivor' ? 'inline-block' : 'none';
    dietGroup.appendChild(popoverBtn);

    // Popover initialisieren
    new bootstrap.Popover(popoverBtn);

    dietSelect.addEventListener('change', () => {
      popoverBtn.style.display = dietSelect.value === 'Omnivor' ? 'inline-block' : 'none';
    });

    wrapper.appendChild(dietGroup);

    // Allergien
    const allergyGroup = document.createElement('div');
    allergyGroup.className = 'mb-3';
    allergyGroup.innerHTML = `<label class="form-label d-block">Allergien</label>`;

    const radioNo = document.createElement('input');
    radioNo.type = 'radio';
    radioNo.className = 'form-check-input';
    radioNo.name = `person_allergies_choice_${index}`;
    radioNo.value = 'Nein';
    if (!person.allergies || person.allergies.toLowerCase() === 'nein') radioNo.checked = true;

    const labelNo = document.createElement('label');
    labelNo.className = 'form-check-label me-3';
    labelNo.textContent = 'Nein';
    labelNo.prepend(radioNo);

    const radioYes = document.createElement('input');
    radioYes.type = 'radio';
    radioYes.className = 'form-check-input';
    radioYes.name = `person_allergies_choice_${index}`;
    radioYes.value = 'Ja';
    if (person.allergies && person.allergies.toLowerCase() !== 'nein') radioYes.checked = true;

    const labelYes = document.createElement('label');
    labelYes.className = 'form-check-label me-3';
    labelYes.textContent = 'Ja';
    labelYes.prepend(radioYes);

    const allergyText = document.createElement('input');
    allergyText.type = 'text';
    allergyText.name = 'person_allergies[]';
    allergyText.className = 'form-control mt-2';
    allergyText.placeholder = 'Bitte Allergien angeben';
    allergyText.style.display = radioYes.checked ? 'block' : 'none';
    allergyText.value = radioYes.checked ? person.allergies : 'Nein';

    radioYes.addEventListener('change', () => {
      allergyText.style.display = 'block';
      allergyText.value = '';
    });
    radioNo.addEventListener('change', () => {
      allergyText.style.display = 'none';
      allergyText.value = 'Nein';
    });

    allergyGroup.appendChild(labelNo);
    allergyGroup.appendChild(labelYes);
    allergyGroup.appendChild(allergyText);
    wrapper.appendChild(allergyGroup);
    return wrapper;
  }

  function renderPersons(count) {
    personsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const person = existingPersons[i] || {};
      personsContainer.appendChild(createPersonBlock(i, person));
    }
  }

  function updateGuestCount() {
    const count = parseInt(guestRange.value, 10) || 1;
    if (guestDisplay) guestDisplay.textContent = count;
    renderPersons(count);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (attendingState === true && attendYes) attendYes.checked = true;
    if (attendingState === false && attendNo) attendNo.checked = true;

    showHideDetails();
    if (attendYes) attendYes.addEventListener('change', showHideDetails);
    if (attendNo) attendNo.addEventListener('change', showHideDetails);

    if (guestRange) {
      guestRange.value = initialGuests;

      // Personen immer rendern
      const count = parseInt(guestRange.value, 10) || 1;
      renderPersons(count);

      // Slider-Anzeige updaten, falls Range
      if (guestRange.type === 'range') {
        updateGuestCount();
        guestRange.addEventListener('input', updateGuestCount);
      } else if (guestDisplay) {
        guestDisplay.textContent = count; // Hidden Input -> Anzeige trotzdem korrekt
      }
    }
  });
})();
