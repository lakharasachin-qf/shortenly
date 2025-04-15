const linkMap = {};

export function saveLink(id, url) {
    // Make sure the full URL points to your Shopify store
    const storeUrl = 'https://queryfinder.myshopify.com'; // Replace with your actual store domain
    const fullUrl = `${storeUrl}/tools/${id}`; // Adjust this path as needed
    // Save the full URL in localStorage
    localStorage.setItem(id, url);
}  
export function getLink(id) {
    const fullUrl = localStorage.getItem(id);
    return fullUrl ? fullUrl : null;
  }