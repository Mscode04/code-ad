import React from "react";
import customerSupportImage from "./help.jpg"; 
import './Help.css'

const Help = () => {
  return (
    <div className="help-page">
      <div className="help-header">
        <div className="header-content">
          <h1>Help & Support Center</h1>
          <p className="subtitle">We're here to help you get the most out of our system</p>
          <div className="header-decoration"></div>
        </div>
      </div>
      
      <div className="help-sections">
        <div className="contact-support-section">
          <div className="support-image-container">
            <img src={customerSupportImage} alt="Customer support team" className="support-image" />
            <div className="image-overlay"></div>
          </div>
          <div className="support-details">
            <h2><span className="highlight">Contact</span> Our Support Team</h2>
            <p className="support-description">
              Our dedicated support team is available to assist you with any questions or issues you may encounter. 
              Don't hesitate to reach out through any of the channels below.
            </p>
            
            <div className="contact-methods">
              <div className="contact-card phone">
                <div className="contact-icon">📞</div>
                <h3>Phone Support</h3>
                <p>+91 8157980307</p>
                <p className="timings">Monday-Saturday, 9:00 AM - 5:00 PM IST</p>
                <div className="card-hover-effect"></div>
              </div>
              
              <div className="contact-card whatsapp">
                <div className="contact-icon">💬</div>
                <h3>WhatsApp</h3>
                <p>+91 8089124307</p>
                <p className="timings">24/7 messaging support</p>
                <div className="card-hover-effect"></div>
              </div>
              
              <div className="contact-card email">
                <div className="contact-icon">✉️</div>
                <h3>Email Us</h3>
                <p>hello@neuraq.in</p>
                <p className="timings">Response within 24 hours</p>
                <div className="card-hover-effect"></div>
              </div>

              <div className="contact-card website">
                <div className="contact-icon">🌐</div>
                <h3>Website</h3>
                <p>neuraq.in</p>
                <p className="timings">Visit our website</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>
            
            <div className="website-link">
              <p>For more information about our services, visit:</p>
              <a href="https://neuraq.in" target="_blank" rel="noopener noreferrer" className="website-button">
                www.neuraq.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;