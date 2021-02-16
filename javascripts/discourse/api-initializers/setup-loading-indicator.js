import { apiInitializer } from "discourse/lib/api";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { observes } from "discourse-common/utils/decorators";
import DiscourseURL from "discourse/lib/url";
import { set } from "@ember/object";
import { isAppWebview } from "discourse/lib/utilities";

export default apiInitializer("0.8", (api) => {
  delete Ember.TEMPLATES["loading"];

  api.modifyClass("route:application", {
    loadingIndicator: service(),

    @action
    loading(transition) {
      this.loadingIndicator.start();
      transition.promise.finally(() => {
        this.loadingIndicator.end();
      });

      return this._super();
    },
  });

  api.modifyClass("component:scrolling-post-stream", {
    // Core currently relies on the intermediate loading screen to reload the scrolling-post-stream
    // component. This change should probably be made in core, but keeping it here for now.
    @observes("posts")
    _postsChanged() {
      this.queueRerender();
    },
  });

  api.modifyClass("component:topic-list-item", {
    // Core updates the header with topic information as soon as a topic-list-item is clicked
    // This feels a little weird when the body is still showing old post content, so disable
    // that behavior.
    navigateToTopic(topic, href) {
      // this.appEvents.trigger("header:update-topic", topic); // This is the core line we're removing
      DiscourseURL.routeTo(href || topic.get("url"));
      return false;
    },
  });

  api.modifyClass("controller:discovery", {
    set loading(value) {
      // no-op. We don't want the loading spinner to show on the discovery routes any more
    },
  });

  if (isAppWebview()) {
    document.body.classList.add("discourse-hub-webview");
  }

  // Remove the custom refresh implementation and use the router
  api.modifyClass("controller:discovery/topics", {
    @action
    refresh() {
      this.send("triggerRefresh");
    },
  });

  api.modifyClass("route:discovery", {
    @action
    triggerRefresh() {
      this.refresh();
    },
  });
});
