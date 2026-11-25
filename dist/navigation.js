import {contactEmail} from './contact-settings.js';

const dialog = document.querySelector('#info');
const copy = dialog.querySelector('.info-copy');
const panels = {
  about: `<h2 id="info-title">Fashion, beyond the fitting room.</h2>
    <p>DЯAPE is a digital fashion experience designed to transform how people discover, style and explore clothing.</p>
    <p>By bringing fashion discovery, virtual fitting, personalised size guidance and outfit recommendations into one immersive environment, DЯAPE aims to bridge the gap between online shopping and the physical fitting room.</p>
    <p>Discover clothing from local fashion brands, explore your personal style and make more confident fashion decisions.</p>
    <dl><dt>Virtual Try-On</dt><dd>Explore how different garments could look on you. The live preview is available, and clothing replacement is in development.</dd>
    <dt>Find My Size</dt><dd>Discover a fit suited to your measurements and preferences. Sizing is currently a prototype.</dd>
    <dt>Complete the Look</dt><dd>Find complementary pieces and build coordinated outfits with catalogue-based suggestions.</dd></dl>`,
  brands: `<h2 id="info-title">Your collection. A new perspective.</h2>
    <p>DЯAPE aims to give fashion brands a more immersive way to showcase their collections and connect with customers.</p>
    <p>Through interactive clothing discovery, virtual fitting experiences and personalised styling tools, we want to help brands create more engaging digital fashion experiences.</p>
    <ul><li>Immersive collection presentation</li><li>Virtual fitting room integration</li><li>Increased product discovery</li><li>Personalised styling recommendations</li><li>Opportunities to improve customer purchasing confidence</li></ul>
    <button type="button" data-partner>Partner with DЯAPE ↗</button>`,
  contact: `<h2 id="info-title">Let's create something different.</h2>
    <p>Whether you are a fashion brand interested in collaborating, a customer with feedback or someone interested in the future of digital fashion, we would love to hear from you.</p>
    <form class="contact-form">
      <label>Name<input name="name" autocomplete="name" required></label>
      <label>Email address<input name="email" type="email" autocomplete="email" required></label>
      <label>Enquiry type<select name="type"><option>General enquiry</option><option>Brand partnership</option><option>Feedback</option><option>Technical support</option></select></label>
      <label>Message<textarea name="message" rows="4" required></textarea></label>
      <button>Send Message ↗</button>
      <small>Opens a draft in your email application.</small>
    </form>`
};
function show(name, partnership = false) {
  copy.innerHTML = panels[name];
  if (partnership) copy.querySelector('select').value = 'Brand partnership';
  if (!dialog.open) dialog.showModal();
  if (partnership) copy.querySelector('input').focus();
}
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click', () => show(button.dataset.info)));
let downOnBackdrop = false;
dialog.addEventListener('pointerdown', event => { downOnBackdrop = event.target === dialog; });
dialog.addEventListener('click', event => {
  if (event.target.closest('[data-partner]')) show('contact', true);
  if (downOnBackdrop && event.target === dialog) dialog.close();
  downOnBackdrop = false;
});
dialog.addEventListener('submit', event => {
  if (!event.target.matches('.contact-form')) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const subject = 'DЯAPE · ' + data.get('type');
  const body = 'Name: ' + data.get('name') + '\r\nEmail: ' + data.get('email') + '\r\n\r\n' + data.get('message');
  location.href = 'mailto:' + contactEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
});
