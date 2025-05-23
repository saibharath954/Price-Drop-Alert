# At backend/test_scraper.py
import asyncio
from app.scraper.amazon import AmazonScraper

url = "https://www.amazon.in/dp/B09PRK7ZSD/ref=vp_d_fuw_pd?_encoding=UTF8&pf_rd_p=057b309c-16d3-4acf-8aa9-4d6460133982&pf_rd_r=RA3YWQXCNRPFZ7TA0XYY&pd_rd_wg=u7XiN&pd_rd_i=B09PRK7ZSD&pd_rd_w=rfXil&content-id=amzn1.sym.057b309c-16d3-4acf-8aa9-4d6460133982&pd_rd_r=186f6b71-f0ab-4471-a138-dd486c754e0e&th=1"

async def main():
    scraper = AmazonScraper()
    data = await scraper.scrape(url)
    print("Scraped Data:")
    print(data)

if __name__ == "__main__":
    asyncio.run(main())
