require 'sinatra'

get '/' do
  File.read 'histogram/index.html'
end

get '/data/:file' do
  File.read File.join('../data/', params[:file])
end