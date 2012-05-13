Webapp::Application.routes.draw do
  match '/upload' => 'application#upload'
end
