require 'sinatra'

get '/' do
  File.read 'graph/index.html'
end

get '/data/:file' do
  content_type `file --mime-type -b graph/#{ params[:file] }`.chomp
  File.read File.join('../data/', params[:file])
end

get '/css/:file' do
  content_type 'text/css'
  File.read File.join('graph/css', params[:file])
end

get '/js/:file' do
  content_type 'text/javascript'
  File.read File.join('graph/js', params[:file])
end  

get '/fonts/:file' do
  File.read File.join('graph/fonts', params[:file])
end

get '/:file' do
  content_type `file --mime-type -b graph/#{ params[:file] }`.chomp
  File.read File.join('graph', params[:file])
end
