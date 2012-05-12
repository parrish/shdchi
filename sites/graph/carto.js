var cartodb_table_name  = "segments_export",
    cartodb_table_id    = "2636",
    cartodb_user_name   = "parrish",
      TILEHTTP = "https",
      TILESERVER = "cartodb.com",
      SQL_SERVER = 'cartodb.com',
      global_api_url = '/api/v2/';


var cartodb_sql,
    cartodb_style,
    cartodb_params = [];

// Getting vars
for (var i = 0, length = cartodb_params.length; i<length; i++) {
  if (cartodb_params[i].search('style=%23') != -1) {
    cartodb_style = cartodb_params[i].replace('style=','');
  }
  if (cartodb_params[i].search('sql=') != -1) {
    cartodb_sql = cartodb_params[i].replace('sql=','');
  }
}
