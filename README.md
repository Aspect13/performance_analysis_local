# plugin_template

# Structure
* ### /api
directory for api endpoints
* ### /components
directory for `render_template` slots
* ### /models
directory for db sqlalchemy models and `pydatinc` serializers* 

*naming convention: `[model]_pd.py`

* ### /static
  directory for static files
  * /css/ - subdirecory for .css files
  * /js/ - subdirectory for .js files

* ### /templates
directory for .html files / jinja templates

* ### config.yml
file for module settings, accessible 

* ### init_db.py [optional]
if plugin has db models init here

* ### metadata.json
metadata file

* ### rpc.py [optional]
file for rpc functions

