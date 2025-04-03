from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

def scrape_mmt(origin, destination, date):
    try:
        # Setup Chrome options for less detection
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36")
        
        # Initialize driver
        service = Service("path/to/chromedriver")  # Update this path
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Format date to DD-MM-YYYY if needed
        # Example: Convert '15/10/2023' to '15-10-2023' if needed
        formatted_date = date.replace('/', '-')
        
        # Build the correct MakeMyTrip URL format
        url = f"https://www.makemytrip.com/flight/search?itinerary={origin}-{destination}-{formatted_date}"
        print(f"Accessing URL: {url}")
        
        driver.get(url)
        
        # Wait for the page to load and handle any popup
        time.sleep(5)  # Initial wait for page load
        
        try:
            # Handle common popup (adjust selector as needed)
            popup = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, ".close"))
            )
            popup.click()
        except:
            print("No popup found or unable to close it")
        
        # Wait for prices to load (adjust selector to match the actual price elements)
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".priceSection .actual-price"))
            )
        except TimeoutException:
            print("Timeout waiting for price elements")
        
        # Extract prices with more specific selector
        prices = driver.find_elements(By.CSS_SELECTOR, ".priceSection .actual-price")
        
        # Process price text
        mmt_prices = []
        for price in prices[:5]:  # Limit to top 5
            try:
                price_text = price.text.replace('₹', '').replace(',', '')
                if price_text.strip():
                    mmt_prices.append(int(price_text))
            except ValueError:
                print(f"Could not parse price: {price.text}")
        
        driver.quit()
        return mmt_prices
    except Exception as e:
        print(f"MMT Scrape Error: {e}")
        return []