\# Browser Network Analysis



\## Website Tested



\*\*Website:\*\* example.com



The page was opened in Google Chrome and inspected using DevTools → Network.



The \*\*Disable cache\*\* option was enabled before reloading the page. No network throttling was applied.



\## Network Summary



| Metric                 | Observation |

| ---------------------- | ----------: |

| Total requests         |           7 |

| Total data transferred |      457 kB |

| Total resources        |      457 kB |

| DOMContentLoaded       |       67 ms |

| Load                   |       96 ms |

| Finish                 |      121 ms |



\## Slowest Resource



The slowest resource observed was the main `example.com` document.



| Property | Value         |

| -------- | ------------- |

| Name     | `example.com` |

| Status   | `200`         |

| Type     | `document`    |

| Size     | 0.5 kB        |

| Time     | 212 ms        |



The main document took 212 ms, which was the highest request time visible in the Network waterfall.



\## HTTP Status Codes



All 7 observed requests returned HTTP status `200 OK`.



No `3xx` or `4xx` responses were observed during the page reload.



A `200 OK` status means that the server successfully processed the request and returned the requested resource.



\## Waterfall Observations



The Network waterfall shows that the browser first requested the main HTML document and then loaded additional resources such as JavaScript files.



The main document was the slowest individual resource at 212 ms. The JavaScript resources loaded more quickly; for example, the `intro-offer.tsx-CAh7S45J.js` resource took 26 ms.



The page completed its loading process quickly, with `DOMContentLoaded` at 67 ms and the reported Load event at 96 ms.



\## Conclusion



The tested page generated 7 network requests and transferred 457 kB of data. No 3xx or 4xx responses were observed. The main HTML document was the slowest individual request at 212 ms. The Network panel provided a useful view of how the browser requested the page and its associated resources.



