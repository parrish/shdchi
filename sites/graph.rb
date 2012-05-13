require 'sinatra'

get '/' do
  File.read 'graph/index.html'
end

get '/data/:file' do
  File.read File.join('../data/', params[:file])
end

get '/:file' do
  File.read File.join('graph', params[:file])
end
