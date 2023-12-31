import { Modal } from './UI/Modal';
import { Map } from './UI/Map';
import { getAddressFromCoords, getCoordsFromAddress } from './Utility/Location';

class PlaceFinder {
  constructor() {
    const addressForm = document.querySelector('form');
    const locateUserBtn = document.getElementById('locate-btn');
    this.shareBtn = document.getElementById('share-btn');

    addressForm.addEventListener('submit', this.findAddressHandler.bind(this));
    locateUserBtn.addEventListener('click', this.locateUserHandler.bind(this));
    this.shareBtn.addEventListener('click', this.sharePlaceHandler);
  }

  sharePlaceHandler() {
    const sharedLinkInputElement = document.getElementById('share-link');

    if (!navigator.clipboard) {

      return;
    }

    navigator.clipboard.writeText(sharedLinkInputElement.value)
      .then(() => {
        alert('Copied into clipboard!');
      })
      .catch(error => {
        console.log(error);
        sharedLinkInputElement.select();
      });
  }

  selectPlace(coordinates, address) {
    if (this.map) {
      this.map.render();
    } else {
      this.map = new Map(coordinates);
    }

    fetch('http://localhost:3000/add-location', {
      method: 'POST',
      body: JSON.stringify({
        address: address,
        lat: coordinates.lat,
        lng: coordinates.lng
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      const locationId = data.locId;
      this.shareBtn.disabled = false;
      const sharedLinkInputElement = document.getElementById('share-link');
      sharedLinkInputElement.value = `${location.origin}/my-place?location=${locationId}`;
    });
  }

  locateUserHandler() {
    if (!navigator.geolocation) {
      alert(
        'Location feature is not available in your browser - please use a more modern browser or manually enter an address.'
      );
      return;
    }
    const modal = new Modal('loading-modal-content', 'Loading location - please wait!');
    modal.show();
    navigator.geolocation.getCurrentPosition(
      async (successResult) => {
        modal.hide();
        const coordinates = {
          lat: successResult.coords.latitude + Math.random() * 50,
          lng: successResult.coords.longitude + Math.random() * 50,
        };
        const address = await getAddressFromCoords(coordinates);
        this.selectPlace(coordinates, address);
      },
      error => {
        modal.hide();
        alert(
          'Could not locate you unfortunately. Please enter an address manually!'
        );
      }
    );
  }

  async findAddressHandler(event) {
    event.preventDefault();
    const address = event.target.querySelector('input').value;

    if (!address || address.trim().length === 0) {
      alert('Invalid address entered - please try again!');
      return;
    }

    const modal = new Modal('loading-modal-content', 'Loading location - please wait!');

    modal.show();

    try {
      const coordinates = await getAddressFromCoords(address);
      this.selectPlace(coordinates);
    } catch (err) {
      alert(err.message);
    }

    modal.hide();
  }
}

const placeFinder = new PlaceFinder();