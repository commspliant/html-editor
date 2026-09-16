import { PAGE_SEPARATOR, joinPagesToHtml } from '../multiPage'

/** Adversarial HTML used by sanitizer, link, paste, and Editor tests. */
export const XSS_PAYLOADS = {
  entityEncodedJavascriptHref: '<a href="&#106;avascript:alert(1)">Link</a>',
  hexEntityEncodedJavascriptHref: '<a href="&#x6a;avascript:alert(1)">Link</a>',
  nestedEntityEncodedJavascriptHref: '<a href="&#106;&#97;vascript:alert(1)">Link</a>',
  onclick: '<p onclick="alert(1)">Click</p>',
  onerror: '<img src="x" onerror="alert(1)">',
  onmouseover: '<div onmouseover="alert(1)">Hover</div>',
  iframeSrcdoc: '<p>Keep</p><iframe srcdoc="<script>alert(1)</script>"></iframe>',
  svgOnload: '<p>Keep</p><svg onload="alert(1)"></svg>',
  styleImport: '<style>@import url("https://evil.example/x.css"); p { color: red; }</style><p>Hi</p>',
  linkHoverHtml: '<img src="x" onerror="alert(1)">',
  vbscriptHref: '<a href="vbscript:msgbox(1)">Link</a>',
  dataTextHtmlHref: '<a href="data:text/html,<script>alert(1)</script>">Link</a>',
  scriptTag: '<p>Hello</p><script>alert(1)</script>',
  objectEmbed: '<p>Keep</p><object data="https://evil.example"></object><embed src="https://evil.example">',
  formInputButton:
    '<p>Keep</p><form action="javascript:alert(1)"><input name="x"><button onclick="alert(1)">Go</button></form>',
  emailTable:
    '<table style="width:100%;border-collapse:collapse"><tr><td style="color:red;padding:8px">Cell</td></tr></table>',
} as const

export const XSS_MULTI_PAGE_HTML = joinPagesToHtml([
  '<p>Safe</p>',
  `<p>Two</p><script>alert(1)</script>`,
])

export const XSS_MULTI_PAGE_WITH_SEPARATOR =
  `<p>One</p>\n${PAGE_SEPARATOR}\n<p>Two</p><script>document.cookie</script>`
