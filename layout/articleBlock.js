import { html } from "./utils";

export default (contents, file) => html`
      <section class="articleBlock">
      ${contents}
      </section>

      <div>
        <em>
          Did you find a mistake or have a suggestion for an improvement?
          <a href="https://github.com/mariusGundersen/website/issues/new" target="_blank">Let me know</a>
          or
          <a href="https://github.com/mariusGundersen/website/blob/master/article/${file.slug}/index.md" target="_blank">fork it</a>
          and send me a pull-request.
        </em>
      </div>
`;