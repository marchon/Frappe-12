// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide('frappe.views.list_view');

cur_list = null;
frappe.views.ListFactory = frappe.views.Factory.extend({
	make: function (route) {
		var me = this;
		var doctype = route[1];
		frappe.model.with_doctype(doctype, function () {
			if (locals['DocType'][doctype].issingle) {
				frappe.set_re_route('Form', doctype);
			} else {
				// List / Gantt / Kanban / etc
				// File is a special view
				const view_name = doctype !== 'File' ? route[2] : 'File';
				let view_class = frappe.views[view_name + 'View'];
				if (!view_class) view_class = frappe.views.ListView;

				if (view_class && view_class.load_last_view && view_class.load_last_view()) {
					// view can have custom routing logic
					return;
				}

				frappe.provide('frappe.views.list_view.' + doctype);
				const page_name = frappe.get_route_str();

				if (!frappe.views.list_view[page_name]) {
					frappe.views.list_view[page_name] = new view_class({
						doctype: doctype,
						parent: me.make_page(true, page_name)
					});
				} else {
					frappe.container.change_to(page_name);
				}
				me.set_cur_list();
			}
		});
	},
	show: function () {
		if(this.re_route_to_view()) {
			return;
		}
		this.set_module_breadcrumb();
		this._super();
		this.set_cur_list();
		cur_list && cur_list.show();
	},
	re_route_to_view: function() {
		var route = frappe.get_route();
		var doctype = route[1];
		var last_route = frappe.route_history.slice(-2)[0];
		if (route[0] === 'List' && route.length === 2 && frappe.views.list_view[doctype]) {
			if(last_route && last_route[0]==='List' && last_route[1]===doctype) {
				// last route same as this route, so going back.
				// this happens because #List/Item will redirect to #List/Item/List
				// while coming from back button, the last 2 routes will be same, so
				// we know user is coming in the reverse direction (via back button)

				// example:
				// Step 1: #List/Item redirects to #List/Item/List
				// Step 2: User hits "back" comes back to #List/Item
				// Step 3: Now we cannot send the user back to #List/Item/List so go back one more step
				window.history.go(-1);
				return true;
			} else {
				return false;
			}
		}
	},
	set_module_breadcrumb: function () {
		if (frappe.route_history.length > 1) {
			var prev_route = frappe.route_history[frappe.route_history.length - 2];
			if (prev_route[0] === 'modules') {
				var doctype = frappe.get_route()[1],
					module = prev_route[1];
				if (frappe.module_links[module] && frappe.module_links[module].includes(doctype)) {
					// save the last page from the breadcrumb was accessed
					frappe.breadcrumbs.set_doctype_module(doctype, module);
				}
			}
		}
	},
	set_cur_list: function () {
		var route = frappe.get_route();
		var page_name = frappe.get_route_str();
		cur_list = frappe.views.list_view[page_name];
		if (cur_list && cur_list.doctype !== route[1]) {
			// changing...
			cur_list = null;
		}
	}
});
