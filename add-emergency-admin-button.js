// Add Emergency Admin Button
// This script adds an emergency admin button to the page if the normal one isn't working

/**
 * Add an emergency admin button to the page
 */
function addEmergencyAdminButton() {
  console.log('🔧 Adding Emergency Admin Button to page...');
  
  // Check if button already exists
  const existingButton = document.getElementById('manual-emergency-admin-btn');
  if (existingButton) {
    console.log('⚠️ Emergency admin button already exists');
    existingButton.style.display = 'block';
    return;
  }
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'manual-emergency-admin-btn';
  button.innerHTML = '🚨 Manual Emergency Admin Access';
  button.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    z-index: 9999;
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    font-size: 14px;
    transition: all 0.3s ease;
  `;
  
  // Add hover effects
  button.onmouseover = () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.6)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
  };
  
  // Add click handler
  button.onclick = async () => {
    console.log('🔗 Manual emergency admin button clicked');
    
    // Try different approaches to grant admin access
    if (typeof window.robustEmergencyAdminAccess === 'function') {
      console.log('🔧 Using robustEmergencyAdminAccess...');
      await window.robustEmergencyAdminAccess();
    } else if (typeof window.grantEmergencyAdmin === 'function') {
      console.log('🔧 Using grantEmergencyAdmin...');
      await window.grantEmergencyAdmin();
    } else {
      console.log('❌ No emergency admin function available');
      alert('No emergency admin function available. Please check the console for details.');
    }
  };
  
  // Add to page
  document.body.appendChild(button);
  
  console.log('✅ Emergency admin button added to top-right corner');
  console.log('🎯 Button will attempt to grant admin access when clicked');
  
  // Auto-remove after 5 minutes
  setTimeout(() => {
    if (document.getElementById('manual-emergency-admin-btn')) {
      button.remove();
      console.log('🕐 Manual emergency admin button auto-removed after 5 minutes');
    }
  }, 300000); // 5 minutes
  
  return button;
}

/**
 * Remove the emergency admin button
 */
function removeEmergencyAdminButton() {
  const button = document.getElementById('manual-emergency-admin-btn');
  if (button) {
    button.remove();
    console.log('✅ Manual emergency admin button removed');
  } else {
    console.log('⚠️ Manual emergency admin button not found');
  }
}

/**
 * Add a simpler floating action button
 */
function addSimpleAdminButton() {
  console.log('🔧 Adding Simple Admin Button to page...');
  
  // Check if button already exists
  const existingButton = document.getElementById('simple-admin-btn');
  if (existingButton) {
    console.log('⚠️ Simple admin button already exists');
    existingButton.style.display = 'block';
    return;
  }
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'simple-admin-btn';
  button.innerHTML = '👑';
  button.title = 'Emergency Admin Access';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Add hover effects
  button.onmouseover = () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  };
  
  // Add click handler
  button.onclick = async () => {
    console.log('🔗 Simple admin button clicked');
    
    // Try to grant admin access
    if (typeof window.robustEmergencyAdminAccess === 'function') {
      await window.robustEmergencyAdminAccess();
    } else {
      alert('Emergency admin functions not available. Check console for details.');
    }
  };
  
  // Add to page
  document.body.appendChild(button);
  
  console.log('✅ Simple admin button added to bottom-right corner');
  
  // Auto-remove after 10 minutes
  setTimeout(() => {
    if (document.getElementById('simple-admin-btn')) {
      button.remove();
      console.log('🕐 Simple admin button auto-removed after 10 minutes');
    }
  }, 600000); // 10 minutes
  
  return button;
}

// Export functions
window.addEmergencyAdminButton = addEmergencyAdminButton;
window.removeEmergencyAdminButton = removeEmergencyAdminButton;
window.addSimpleAdminButton = addSimpleAdminButton;

console.log('🔧 Emergency Admin Button Tools Loaded!');
console.log('');
console.log('Available functions:');
console.log('  addEmergencyAdminButton() - Add a full emergency admin button to the page');
console.log('  addSimpleAdminButton() - Add a simple floating admin button to the page');
console.log('  removeEmergencyAdminButton() - Remove the manual emergency admin button');
console.log('');
console.log('Example usage:');
console.log('  addEmergencyAdminButton()');
console.log('  addSimpleAdminButton()');