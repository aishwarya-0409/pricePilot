from scraper import scrape_across_platforms
import json

results = scrape_across_platforms("iphone 16")
print(json.dumps(results, indent=2))
