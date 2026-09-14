/**
 * Fills the `{project}` slot in the per-project link-label templates
 * (`UiCopy.sourceFor` / `liveFor` / `caseStudyFor`).
 *
 * The desk repeats three visible link labels — SOURCE, LIVE, CASE STUDY — once
 * per project, and each anchor points somewhere different. Identical accessible
 * name plus different destination is exactly what WCAG 2.4.9 flags (axe rule
 * `identical-links-same-purpose`), so every one of those links carries an
 * `aria-label` naming its own project. Visible copy never changes.
 *
 * The templates are strings rather than functions on purpose: the copy map is
 * walked with `JSON.stringify` by the privacy and font-subset guards, and
 * `JSON.stringify` drops function values — storing functions here would blind
 * both scans to these strings.
 */
export function linkLabel(template: string, project: string): string {
  return template.replace("{project}", project);
}
