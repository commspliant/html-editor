import type { RenderingCapabilities } from './types'

export const COMMSPLIANT_EMAIL_CONTRACT: RenderingCapabilities = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'CommsPliantEmailContract',
  version: '1.0.0',
  description:
    'Validation contract for AI generators, WYSIWYG/Drag-and-Drop editors, and post-processing inliners.',
  global_rules: {
    layout_mode: 'table-based',
    require_inlining: true,
    max_container_width_px: 600,
    strip_unknown_tags: true,
    strip_unknown_attributes: true,
  },
  html_elements: {
    allowed_tags: [
      {
        tag: 'table',
        required_attributes: {
          border: '0',
          cellpadding: '0',
          cellspacing: '0',
          role: 'presentation',
        },
        allowed_attributes: ['width', 'align', 'bgcolor', 'style'],
        disallowed_css: ['margin'],
      },
      {
        tag: 'td',
        allowed_attributes: ['width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan', 'style'],
        recommended_css: ['padding', 'background-color', 'font-family'],
      },
      {
        tag: 'img',
        required_attributes: {
          border: '0',
        },
        allowed_attributes: ['src', 'alt', 'width', 'height', 'style'],
        forced_css: {
          display: 'block',
          outline: 'none',
          'text-decoration': 'none',
        },
      },
      {
        tag: 'a',
        allowed_attributes: ['href', 'target', 'title', 'style'],
        default_attributes: {
          target: '_blank',
        },
      },
      {
        tag: 'tr',
        allowed_attributes: ['align', 'valign', 'bgcolor', 'style'],
      },
      {
        tag: 'p',
        allowed_attributes: ['align', 'style'],
        disallowed_css: ['margin-top'],
      },
      {
        tag: 'span',
        allowed_attributes: ['style'],
      },
      {
        tag: 'div',
        status: 'restricted',
        notes: 'Allowed only for max-width wrappers; must not be used for primary layout structure.',
        allowed_attributes: ['align', 'style'],
      },
    ],
    disallowed_tags: [
      'script',
      'iframe',
      'form',
      'input',
      'button',
      'select',
      'textarea',
      'svg',
      'canvas',
      'video',
      'audio',
      'embed',
      'object',
    ],
  },
  css_properties: [
    {
      property: 'background-color',
      status: 'allowed',
      allowed_values: ['hex', 'rgb'],
      disallowed_values: ['rgba', 'hsl', 'hsla'],
    },
    {
      property: 'background-image',
      status: 'restricted',
      fallback_required: 'background-color',
    },
    {
      property: 'padding',
      status: 'allowed',
      restrictions: 'Must only be applied to <td> tags. Outlook ignores padding applied to <div>, <p>, or <a> tags.',
      allowed_on_tags: ['td'],
    },
    {
      property: 'margin',
      status: 'restricted',
      fallback: 'padding',
    },
    {
      property: 'border-radius',
      status: 'allowed_with_degradation',
    },
    {
      property: 'font-family',
      status: 'allowed',
      allowed_values: [
        'Arial',
        'Helvetica',
        'Verdana',
        'Georgia',
        'Times New Roman',
        'Trebuchet MS',
        'sans-serif',
        'serif',
      ],
    },
    {
      property: 'display',
      status: 'restricted',
      allowed_values: ['block', 'inline-block', 'none'],
      disallowed_values: ['flex', 'inline-flex', 'grid', 'inline-grid', 'contents'],
    },
    {
      property: 'position',
      status: 'disallowed',
    },
    {
      property: 'float',
      status: 'disallowed',
    },
  ],
}

export const PERMISSIVE_WEB_CONTRACT: RenderingCapabilities = {
  title: 'PermissiveWebContract',
  version: '1.0.0',
  global_rules: {
    strip_unknown_tags: false,
    strip_unknown_attributes: false,
  },
  html_elements: {
    allowed_tags: [
      { tag: 'p', allowed_attributes: ['style', 'class', 'id'] },
      { tag: 'div', allowed_attributes: ['style', 'class', 'id'] },
      { tag: 'h1', allowed_attributes: ['style', 'class', 'id'] },
      { tag: 'h2', allowed_attributes: ['style', 'class', 'id'] },
      { tag: 'video', allowed_attributes: ['src', 'controls', 'style', 'width', 'height'] },
      { tag: 'audio', allowed_attributes: ['src', 'controls', 'style'] },
      { tag: 'ul', allowed_attributes: ['style'] },
      { tag: 'ol', allowed_attributes: ['style'] },
      { tag: 'li', allowed_attributes: ['style'] },
      { tag: 'hr', allowed_attributes: ['style'] },
      { tag: 'a', allowed_attributes: ['href', 'target', 'title', 'style', 'name', 'id'] },
      { tag: 'img', allowed_attributes: ['src', 'alt', 'width', 'height', 'style'] },
      { tag: 'table', allowed_attributes: ['style', 'width', 'border', 'cellpadding', 'cellspacing'] },
      { tag: 'tr', allowed_attributes: ['style'] },
      { tag: 'td', allowed_attributes: ['style', 'colspan', 'rowspan'] },
      { tag: 'span', allowed_attributes: ['style'] },
    ],
    disallowed_tags: ['script'],
  },
  css_properties: [
    {
      property: 'display',
      status: 'allowed',
      allowed_values: ['block', 'inline-block', 'flex', 'grid', 'none'],
    },
    {
      property: 'position',
      status: 'allowed',
    },
    {
      property: 'background-image',
      status: 'allowed',
    },
    {
      property: 'margin',
      status: 'allowed',
    },
  ],
}
