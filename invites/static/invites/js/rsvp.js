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
  const initialGuests = safeParseJSON('initialGuests-data', 0);
  const attendingState = safeParseJSON('initialAttending-data', null);

  const attendYes = document.querySelector('input[name="attending"][value="True"]');
  const attendNo = document.querySelector('input[name="attending"][value="False"]');
  const details = el('attend-details');
  const guestRange = el('guest-count');
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

    // Name Input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'mb-3';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'form-label';
    nameLabel.textContent = 'Dein Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'person_name[]';
    nameInput.required = true;
    nameInput.className = 'form-control';
    nameInput.value = person.name || '';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    wrapper.appendChild(nameGroup);

    // Essgewohnheiten Select
    const dietGroup = document.createElement('div');
    dietGroup.className = 'mb-3';
    const dietLabel = document.createElement('label');
    dietLabel.className = 'form-label';
    dietLabel.textContent = 'Wie ernährst du dich?';
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
    dietGroup.appendChild(dietLabel);
    dietGroup.appendChild(dietSelect);
    wrapper.appendChild(dietGroup);

    // Allergien Radios + ggf. Textfeld
    const allergyGroup = document.createElement('div');
    allergyGroup.className = 'mb-3';
    const allergyLabel = document.createElement('label');
    allergyLabel.className = 'form-label d-block';
    allergyLabel.textContent = 'Hast du irgendwelche Allergien?';
    allergyGroup.appendChild(allergyLabel);

    const radioWrapper = document.createElement('div');
    radioWrapper.className = 'form-check form-check-inline';

    // Nein Radio
    const radioNo = document.createElement('input');
    radioNo.type = 'radio';
    radioNo.name = `person_allergies_choice_${index}`;
    radioNo.value = 'Nein';
    radioNo.className = 'form-check-input';
    if (!person.allergies || person.allergies.toLowerCase() === 'nein') {
      radioNo.checked = true;
    }
    const labelNo = document.createElement('label');
    labelNo.className = 'form-check-label';
    labelNo.textContent = 'Nein';
    radioWrapper.appendChild(radioNo);
    radioWrapper.appendChild(labelNo);

    const radioWrapperYes = document.createElement('div');
    radioWrapperYes.className = 'form-check form-check-inline';

    // Ja Radio
    const radioYes = document.createElement('input');
    radioYes.type = 'radio';
    radioYes.name = `person_allergies_choice_${index}`;
    radioYes.value = 'Ja';
    radioYes.className = 'form-check-input';
    if (person.allergies && person.allergies.toLowerCase() !== 'nein') {
      radioYes.checked = true;
    }
    const labelYes = document.createElement('label');
    labelYes.className = 'form-check-label';
    labelYes.textContent = 'Ja';
    radioWrapperYes.appendChild(radioYes);
    radioWrapperYes.appendChild(labelYes);

    const allergyText = document.createElement('input');
    allergyText.type = 'text';
    allergyText.name = 'person_allergies[]';
    allergyText.className = 'form-control mt-2';
    allergyText.placeholder = 'Bitte Allergien angeben';
    allergyText.style.display = radioYes.checked ? 'block' : 'none';
    allergyText.value = radioYes.checked ? person.allergies : '';

    radioYes.addEventListener('change', () => {
      allergyText.style.display = 'block';
      allergyText.value = '';
    });
    radioNo.addEventListener('change', () => {
      allergyText.style.display = 'none';
      allergyText.value = 'Nein';
    });

    allergyGroup.appendChild(radioWrapper);
    allergyGroup.appendChild(radioWrapperYes);
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
    const count = parseInt(guestRange.value, 10) || 0;
    guestDisplay.textContent = count;
    renderPersons(count);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (attendingState === true && attendYes) attendYes.checked = true;
    if (attendingState === false && attendNo) attendNo.checked = true;

    if (attendYes) attendYes.addEventListener('change', showHideDetails);
    if (attendNo) attendNo.addEventListener('change', showHideDetails);
    showHideDetails();

    if (guestRange) {
      guestRange.value = initialGuests || 0;
      updateGuestCount();
      guestRange.addEventListener('input', updateGuestCount);
    } else {
      renderPersons(initialGuests || 0);
    }
  });
})();
