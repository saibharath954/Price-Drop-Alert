# At backend/test_scraper.py
import asyncio
from app.scraper.amazon import AmazonScraper

url = "https://www.amazon.in/Geetanjali-Crafts-Handcrafted-Decoration-Pink/dp/B0C55JMDX7/ref=pd_subss_hxwPER_sspa_dk_detail_d_sccl_5_3/261-8528084-2435065?pd_rd_r=010d3123-75fb-42df-94b0-466d1e83c2e6&pd_rd_wg=zNiQL&pd_rd_w=5G4Vc&pd_rd_i=B0C55JMDX7&psc=1&sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWxfdGhlbWF0aWM="

async def main():
    scraper = AmazonScraper()
    data = await scraper.scrape(url)
    print("Scraped Data:")
    print(data)

if __name__ == "__main__":
    asyncio.run(main())
